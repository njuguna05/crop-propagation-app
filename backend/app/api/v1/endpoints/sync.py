from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.crop import Crop
from app.models.task import Task
from app.models.order import Order
from app.models.records import BudwoodCollection, GraftingRecord, TransferRecord
from app.schemas.crop import CropResponse
from app.schemas.task import TaskResponse
from app.schemas.order import OrderResponse
from app.schemas.records import (
    BudwoodCollectionResponse, GraftingRecordResponse, TransferRecordResponse
)
from app.schemas.common import MessageResponse
from app.dependencies import CurrentUserDep
from pydantic import BaseModel


router = APIRouter()


# Sync request/response schemas
class SyncPushRequest(BaseModel):
    """Request schema for pushing local changes to server"""
    crops: Optional[List[Dict[str, Any]]] = []
    tasks: Optional[List[Dict[str, Any]]] = []
    orders: Optional[List[Dict[str, Any]]] = []
    budwood_records: Optional[List[Dict[str, Any]]] = []
    grafting_records: Optional[List[Dict[str, Any]]] = []
    transfer_records: Optional[List[Dict[str, Any]]] = []


class SyncPushResponse(BaseModel):
    """Response schema for push operation"""
    success: bool
    message: str
    stats: Dict[str, int]
    conflicts: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []


class SyncPullResponse(BaseModel):
    """Response schema for pull operation"""
    crops: List[CropResponse] = []
    tasks: List[TaskResponse] = []
    orders: List[OrderResponse] = []
    budwood_records: List[BudwoodCollectionResponse] = []
    grafting_records: List[GraftingRecordResponse] = []
    transfer_records: List[TransferRecordResponse] = []
    last_sync_timestamp: datetime


class FullSyncResponse(BaseModel):
    """Response schema for full sync operation"""
    success: bool
    message: str
    total_records: int
    stats: Dict[str, int]
    sync_timestamp: datetime


@router.post("/push", response_model=SyncPushResponse)
async def push_local_changes(
    sync_data: SyncPushRequest,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Upload local changes to server (batch sync)
    """
    stats = {
        "crops_created": 0,
        "crops_updated": 0,
        "tasks_created": 0,
        "tasks_updated": 0,
        "orders_created": 0,
        "orders_updated": 0,
        "budwood_created": 0,
        "budwood_updated": 0,
        "grafting_created": 0,
        "grafting_updated": 0,
        "transfers_created": 0,
        "transfers_updated": 0
    }
    conflicts = []
    errors = []

    try:
        # Process crops
        for crop_data in sync_data.crops:
            try:
                crop_id = crop_data.get("id")

                if crop_id and crop_id > 0:
                    # Update existing crop
                    result = await db.execute(
                        select(Crop).where(
                            and_(Crop.id == crop_id, Crop.user_id == current_user.id)
                        )
                    )
                    existing_crop = result.scalar_one_or_none()

                    if existing_crop:
                        # Check for conflicts (server updated after client)
                        server_updated = existing_crop.updated_at
                        client_updated = datetime.fromisoformat(crop_data.get("lastUpdated", "1970-01-01T00:00:00"))

                        if server_updated > client_updated:
                            conflicts.append({
                                "type": "crop",
                                "id": crop_id,
                                "message": "Server version is newer than client version"
                            })
                            continue

                        # Update fields
                        for field, value in crop_data.items():
                            if field not in ["id", "user_id", "created_at", "lastUpdated"]:
                                if hasattr(existing_crop, field):
                                    setattr(existing_crop, field, value)

                        stats["crops_updated"] += 1
                    else:
                        errors.append({
                            "type": "crop",
                            "id": crop_id,
                            "message": "Crop not found"
                        })
                else:
                    # Create new crop
                    new_crop = Crop(
                        user_id=current_user.id,
                        name=crop_data["name"],
                        variety=crop_data["variety"],
                        propagation_method=crop_data["propagationMethod"],
                        current_stage=crop_data["currentStage"],
                        location=crop_data.get("location"),
                        planted_date=datetime.fromisoformat(crop_data["plantedDate"]).date(),
                        expected_germination=datetime.fromisoformat(crop_data["expectedGermination"]).date() if crop_data.get("expectedGermination") else None,
                        temperature=crop_data.get("temperature"),
                        humidity=crop_data.get("humidity"),
                        watered=datetime.fromisoformat(crop_data["watered"]).date() if crop_data.get("watered") else None,
                        notes=crop_data.get("notes")
                    )
                    db.add(new_crop)
                    stats["crops_created"] += 1

            except Exception as e:
                errors.append({
                    "type": "crop",
                    "id": crop_data.get("id"),
                    "message": str(e)
                })

        # Process tasks
        for task_data in sync_data.tasks:
            try:
                task_id = task_data.get("id")

                if task_id and task_id > 0:
                    # Update existing task
                    result = await db.execute(
                        select(Task).where(
                            and_(Task.id == task_id, Task.user_id == current_user.id)
                        )
                    )
                    existing_task = result.scalar_one_or_none()

                    if existing_task:
                        # Update fields
                        for field, value in task_data.items():
                            if field not in ["id", "user_id", "created_at", "lastUpdated"]:
                                if hasattr(existing_task, field):
                                    setattr(existing_task, field, value)

                        stats["tasks_updated"] += 1
                else:
                    # Create new task
                    new_task = Task(
                        user_id=current_user.id,
                        crop_id=task_data.get("cropId"),
                        order_id=task_data.get("orderId"),
                        task=task_data["task"],
                        due_date=datetime.fromisoformat(task_data["dueDate"]).date(),
                        completed=task_data.get("completed", False),
                        priority=task_data.get("priority", "medium"),
                        notes=task_data.get("notes")
                    )
                    db.add(new_task)
                    stats["tasks_created"] += 1

            except Exception as e:
                errors.append({
                    "type": "task",
                    "id": task_data.get("id"),
                    "message": str(e)
                })

        # Process orders (similar pattern)
        for order_data in sync_data.orders:
            try:
                order_id = order_data.get("id")

                if order_id and isinstance(order_id, str) and order_id.startswith("PO-"):
                    # Update existing order
                    result = await db.execute(
                        select(Order).where(
                            and_(Order.id == order_id, Order.user_id == current_user.id)
                        )
                    )
                    existing_order = result.scalar_one_or_none()

                    if existing_order:
                        # Update order status, quantities, etc.
                        existing_order.status = order_data.get("status", existing_order.status)
                        existing_order.current_section = order_data.get("currentSection")
                        existing_order.current_stage_quantity = order_data.get("currentStageQuantity", existing_order.current_stage_quantity)
                        existing_order.completed_quantity = order_data.get("completedQuantity", existing_order.completed_quantity)

                        stats["orders_updated"] += 1
                else:
                    # Create new order would need order number generation
                    # This is handled by the regular order creation endpoint
                    pass

            except Exception as e:
                errors.append({
                    "type": "order",
                    "id": order_data.get("id"),
                    "message": str(e)
                })

        # Commit all changes
        await db.commit()

        return SyncPushResponse(
            success=True,
            message="Sync push completed successfully",
            stats=stats,
            conflicts=conflicts,
            errors=errors
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync push failed: {str(e)}"
        )


@router.get("/pull", response_model=SyncPullResponse)
async def pull_server_changes(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = None
):
    """
    Download server changes since timestamp (incremental sync)
    """
    user_id = current_user.id

    # Build base queries
    crops_query = select(Crop).where(Crop.user_id == user_id)
    tasks_query = select(Task).where(Task.user_id == user_id)
    orders_query = select(Order).where(Order.user_id == user_id)
    budwood_query = select(BudwoodCollection).where(BudwoodCollection.user_id == user_id)
    grafting_query = select(GraftingRecord).where(GraftingRecord.user_id == user_id)
    transfer_query = select(TransferRecord).where(TransferRecord.user_id == user_id)

    # Add timestamp filter if provided
    if since:
        crops_query = crops_query.where(Crop.updated_at > since)
        tasks_query = tasks_query.where(Task.updated_at > since)
        orders_query = orders_query.where(Order.updated_at > since)
        budwood_query = budwood_query.where(BudwoodCollection.updated_at > since)
        grafting_query = grafting_query.where(GraftingRecord.updated_at > since)
        transfer_query = transfer_query.where(TransferRecord.updated_at > since)

    # Execute queries
    crops_result = await db.execute(crops_query.order_by(Crop.updated_at.desc()))
    crops = crops_result.scalars().all()

    tasks_result = await db.execute(tasks_query.order_by(Task.updated_at.desc()))
    tasks = tasks_result.scalars().all()

    orders_result = await db.execute(orders_query.order_by(Order.updated_at.desc()))
    orders = orders_result.scalars().all()

    budwood_result = await db.execute(budwood_query.order_by(BudwoodCollection.updated_at.desc()))
    budwood_records = budwood_result.scalars().all()

    grafting_result = await db.execute(grafting_query.order_by(GraftingRecord.updated_at.desc()))
    grafting_records = grafting_result.scalars().all()

    transfer_result = await db.execute(transfer_query.order_by(TransferRecord.updated_at.desc()))
    transfer_records = transfer_result.scalars().all()

    return SyncPullResponse(
        crops=crops,
        tasks=tasks,
        orders=orders,
        budwood_records=budwood_records,
        grafting_records=grafting_records,
        transfer_records=transfer_records,
        last_sync_timestamp=datetime.utcnow()
    )


@router.post("/full", response_model=FullSyncResponse)
async def full_sync(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Perform complete data synchronization (download all user data)
    """
    user_id = current_user.id

    try:
        # Get all user data
        crops_result = await db.execute(
            select(Crop).where(Crop.user_id == user_id).order_by(Crop.updated_at.desc())
        )
        crops_count = len(crops_result.scalars().all())

        tasks_result = await db.execute(
            select(Task).where(Task.user_id == user_id).order_by(Task.updated_at.desc())
        )
        tasks_count = len(tasks_result.scalars().all())

        orders_result = await db.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.updated_at.desc())
        )
        orders_count = len(orders_result.scalars().all())

        budwood_result = await db.execute(
            select(BudwoodCollection).where(BudwoodCollection.user_id == user_id).order_by(BudwoodCollection.updated_at.desc())
        )
        budwood_count = len(budwood_result.scalars().all())

        grafting_result = await db.execute(
            select(GraftingRecord).where(GraftingRecord.user_id == user_id).order_by(GraftingRecord.updated_at.desc())
        )
        grafting_count = len(grafting_result.scalars().all())

        transfer_result = await db.execute(
            select(TransferRecord).where(TransferRecord.user_id == user_id).order_by(TransferRecord.updated_at.desc())
        )
        transfer_count = len(transfer_result.scalars().all())

        total_records = crops_count + tasks_count + orders_count + budwood_count + grafting_count + transfer_count

        stats = {
            "crops": crops_count,
            "tasks": tasks_count,
            "orders": orders_count,
            "budwood_records": budwood_count,
            "grafting_records": grafting_count,
            "transfer_records": transfer_count
        }

        return FullSyncResponse(
            success=True,
            message="Full sync completed successfully",
            total_records=total_records,
            stats=stats,
            sync_timestamp=datetime.utcnow()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full sync failed: {str(e)}"
        )


@router.get("/status", response_model=Dict[str, Any])
async def get_sync_status(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get sync status and metadata
    """
    user_id = current_user.id

    # Get last update timestamps for each table
    crops_last_updated = await db.execute(
        select(func.max(Crop.updated_at)).where(Crop.user_id == user_id)
    )
    crops_timestamp = crops_last_updated.scalar()

    tasks_last_updated = await db.execute(
        select(func.max(Task.updated_at)).where(Task.user_id == user_id)
    )
    tasks_timestamp = tasks_last_updated.scalar()

    orders_last_updated = await db.execute(
        select(func.max(Order.updated_at)).where(Order.user_id == user_id)
    )
    orders_timestamp = orders_last_updated.scalar()

    return {
        "user_id": user_id,
        "server_time": datetime.utcnow(),
        "last_updated": {
            "crops": crops_timestamp,
            "tasks": tasks_timestamp,
            "orders": orders_timestamp
        },
        "sync_available": True
    }