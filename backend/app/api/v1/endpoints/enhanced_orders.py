from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, date

from app.core.database import get_db
from app.models.order import Order, OrderStageHistory
from app.models.budwood import BudwoodCollection
from app.models.grafting import GraftingRecord
from app.models.transfer import TransferRecord
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse,
    TransferRequest, HealthAssessmentRequest,
    BudwoodCalculationRequest, BudwoodCalculationResponse,
    StageValidationResponse, WorkerPerformanceResponse
)
from app.services.budwood_service import calculate_budwood_requirements
from app.services.validation_service import validate_stage_requirements
from app.services.analytics_service import get_worker_performance_metrics

router = APIRouter()

# Enhanced order management endpoints
@router.post("/{order_id}/transfer", response_model=dict)
async def transfer_order_to_next_stage(
    order_id: str,
    transfer_data: TransferRequest,
    db: AsyncSession = Depends(get_db)
):
    """Transfer order to next propagation stage with performance tracking"""

    # Get the order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Create transfer record
    transfer_record = TransferRecord(
        order_id=order_id,
        from_section=order.current_section,
        to_section=transfer_data.to_section,
        from_stage=order.status,
        to_stage=transfer_data.to_stage,
        quantity=transfer_data.quantity,
        transfer_date=transfer_data.transfer_date or datetime.now().date(),
        operator=transfer_data.operator,
        quality_score=transfer_data.quality_score,
        notes=transfer_data.notes
    )

    db.add(transfer_record)

    # Update order status and stage history
    order.status = transfer_data.to_stage
    order.current_section = transfer_data.to_section
    order.current_stage_quantity = transfer_data.quantity

    # Add to stage history with worker performance
    stage_history_record = OrderStageHistory(
        order_id=order_id,
        stage=transfer_data.to_stage,
        date=transfer_data.transfer_date or datetime.now().date(),
        quantity=transfer_data.quantity,
        operator=transfer_data.operator,
        notes=transfer_data.notes,
        worker_performance={
            "timeInStage": transfer_data.time_in_previous_stage,
            "qualityScore": transfer_data.quality_score,
            "efficiencyRating": calculate_efficiency_rating(transfer_data.operator, order.status)
        }
    )

    db.add(stage_history_record)

    # Update stage history JSON field as well for compatibility
    if not order.stage_history:
        order.stage_history = []

    order.stage_history.append({
        "stage": transfer_data.to_stage,
        "date": (transfer_data.transfer_date or datetime.now().date()).isoformat(),
        "quantity": transfer_data.quantity,
        "operator": transfer_data.operator,
        "notes": transfer_data.notes,
        "workerPerformance": {
            "timeInStage": transfer_data.time_in_previous_stage,
            "qualityScore": transfer_data.quality_score,
            "efficiencyRating": calculate_efficiency_rating(transfer_data.operator, order.status)
        }
    })

    order.updated_at = datetime.now()

    try:
        await db.commit()
        await db.refresh(order)
        await db.refresh(transfer_record)

        return {
            "success": True,
            "message": f"Order {order.order_number} transferred to {transfer_data.to_stage}",
            "transfer_record_id": transfer_record.id,
            "new_status": order.status
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transfer order: {str(e)}"
        )

@router.post("/{order_id}/health-assessment", response_model=dict)
async def record_health_assessment(
    order_id: str,
    health_data: HealthAssessmentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Record plant health assessment and update quantities"""

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update quantities
    lost_quantity = health_data.lost_quantity
    order.current_stage_quantity = max(0, order.current_stage_quantity - lost_quantity)

    # Add health assessment to notes
    if not order.notes:
        order.notes = []

    health_note = {
        "type": "health_assessment",
        "date": datetime.now().date().isoformat(),
        "lost": lost_quantity,
        "notes": health_data.notes,
        "operator": health_data.operator,
        "assessment_type": health_data.assessment_type,
        "survival_rate": ((order.current_stage_quantity / order.total_quantity) * 100) if order.total_quantity > 0 else 0
    }

    order.notes.append(health_note)
    order.updated_at = datetime.now()

    try:
        await db.commit()
        await db.refresh(order)

        return {
            "success": True,
            "message": "Health assessment recorded",
            "current_quantity": order.current_stage_quantity,
            "lost_quantity": lost_quantity,
            "survival_rate": health_note["survival_rate"]
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record health assessment: {str(e)}"
        )

@router.get("/{order_id}/validate", response_model=StageValidationResponse)
async def validate_stage(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Validate current stage requirements and check for blockers"""

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Perform stage validation
    validation_result = await validate_stage_requirements(order, db)

    return StageValidationResponse(
        order_id=order_id,
        stage=order.status,
        current_stage_complete=validation_result["currentStageComplete"],
        ready_for_next_stage=validation_result["readyForNextStage"],
        blockers=validation_result["blockers"],
        validation_date=datetime.now(),
        recommendations=validation_result.get("recommendations", [])
    )

@router.post("/{order_id}/resolve-blocker", response_model=dict)
async def resolve_blocker(
    order_id: str,
    blocker_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Resolve a stage blocker and update validation status"""

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update stage validation
    if not order.stage_validation:
        order.stage_validation = {
            "currentStageComplete": False,
            "readyForNextStage": False,
            "blockers": []
        }

    # Remove the resolved blocker
    current_blockers = order.stage_validation.get("blockers", [])
    updated_blockers = [b for b in current_blockers if b.get("message") != blocker_data.get("message")]

    order.stage_validation["blockers"] = updated_blockers
    order.stage_validation["currentStageComplete"] = len(updated_blockers) == 0
    order.stage_validation["readyForNextStage"] = len(updated_blockers) == 0

    # Add resolution note
    if not order.notes:
        order.notes = []

    order.notes.append({
        "type": "blocker_resolved",
        "date": datetime.now().date().isoformat(),
        "message": f"Resolved: {blocker_data.get('message', 'Unknown blocker')}",
        "resolvedBy": blocker_data.get("resolver", "System"),
        "resolution_notes": blocker_data.get("resolution_notes", "")
    })

    order.updated_at = datetime.now()

    try:
        await db.commit()
        await db.refresh(order)

        return {
            "success": True,
            "message": "Blocker resolved successfully",
            "remaining_blockers": len(updated_blockers),
            "stage_ready": len(updated_blockers) == 0
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve blocker: {str(e)}"
        )

@router.post("/calculate-budwood", response_model=BudwoodCalculationResponse)
async def calculate_budwood(
    calculation_request: BudwoodCalculationRequest
):
    """Calculate budwood requirements for an order"""

    result = calculate_budwood_requirements(
        quantity=calculation_request.quantity,
        propagation_method=calculation_request.propagation_method,
        waste_factor_percent=calculation_request.waste_factor_percent,
        extra_for_safety=calculation_request.extra_for_safety
    )

    return BudwoodCalculationResponse(**result)

@router.get("/{order_id}/worker-performance", response_model=List[WorkerPerformanceResponse])
async def get_order_worker_performance(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get worker performance metrics for a specific order"""

    result = await db.execute(
        select(Order).options(selectinload(Order.stage_history_records))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    performance_data = []

    for history_record in order.stage_history_records:
        if history_record.worker_performance and history_record.operator:
            performance_data.append(WorkerPerformanceResponse(
                worker_name=history_record.operator,
                stage=history_record.stage,
                date=history_record.date,
                quantity_processed=history_record.quantity,
                quality_score=history_record.worker_performance.get("qualityScore", 0),
                efficiency_rating=history_record.worker_performance.get("efficiencyRating", 0),
                time_in_stage=history_record.worker_performance.get("timeInStage", 0)
            ))

    return performance_data

# Utility functions
def calculate_efficiency_rating(operator: str, stage: str) -> float:
    """Calculate efficiency rating for an operator in a specific stage"""
    # This would typically query historical performance data
    # For now, return a simulated rating
    base_ratings = {
        "budwood_collection": 85,
        "grafting_operation": 80,
        "post_graft_care": 90,
        "quality_check": 95
    }

    base_rating = base_ratings.get(stage, 85)
    # Add some operator-specific variation
    operator_modifier = hash(operator) % 20 - 10  # -10 to +9

    return max(60, min(100, base_rating + operator_modifier))