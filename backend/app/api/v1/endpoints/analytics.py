from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from typing import Dict, List, Any, Optional
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.crop import Crop
from app.models.task import Task
from app.models.order import Order
from app.models.records import BudwoodCollection, GraftingRecord, TransferRecord
from app.schemas.analytics import (
    DashboardStatsResponse,
    PerformanceMetricsResponse,
    SuccessRateAnalysisResponse,
    StageDistributionResponse
)
from app.dependencies import CurrentUserDep


router = APIRouter()


@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive dashboard statistics
    """
    user_id = current_user.id

    # Basic counts
    crops_count = await db.execute(
        select(func.count(Crop.id)).where(Crop.user_id == user_id)
    )
    total_crops = crops_count.scalar()

    pending_tasks_count = await db.execute(
        select(func.count(Task.id)).where(
            and_(Task.user_id == user_id, Task.completed == False)
        )
    )
    pending_tasks = pending_tasks_count.scalar()

    # Revenue and plants
    revenue_plants = await db.execute(
        select(
            func.sum(Order.total_value),
            func.sum(Order.current_stage_quantity)
        ).where(Order.user_id == user_id)
    )
    total_revenue, active_plants = revenue_plants.first()
    total_revenue = float(total_revenue or 0)
    active_plants = active_plants or 0

    # Order statistics
    active_orders_count = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                ~Order.status.in_(["completed", "cancelled", "delivered"])
            )
        )
    )
    active_orders = active_orders_count.scalar()

    completed_orders_count = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                Order.status.in_(["completed", "delivered"])
            )
        )
    )
    completed_orders = completed_orders_count.scalar()

    # Overdue tasks
    today = date.today()
    overdue_tasks_count = await db.execute(
        select(func.count(Task.id)).where(
            and_(
                Task.user_id == user_id,
                Task.completed == False,
                Task.due_date < today
            )
        )
    )
    overdue_tasks = overdue_tasks_count.scalar()

    # Recent activity (last 30 days)
    thirty_days_ago = today - timedelta(days=30)

    recent_grafts_count = await db.execute(
        select(func.sum(GraftingRecord.quantity)).where(
            and_(
                GraftingRecord.user_id == user_id,
                GraftingRecord.date >= thirty_days_ago
            )
        )
    )
    recent_grafts = recent_grafts_count.scalar() or 0

    recent_transfers_count = await db.execute(
        select(func.count(TransferRecord.id)).where(
            and_(
                TransferRecord.user_id == user_id,
                TransferRecord.transfer_date >= thirty_days_ago
            )
        )
    )
    recent_transfers = recent_transfers_count.scalar()

    # Distribution data
    crops_by_stage_result = await db.execute(
        select(Crop.current_stage, func.count(Crop.id))
        .where(Crop.user_id == user_id)
        .group_by(Crop.current_stage)
    )
    crops_by_stage = {stage: count for stage, count in crops_by_stage_result.all()}

    orders_by_status_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.user_id == user_id)
        .group_by(Order.status)
    )
    orders_by_status = {status: count for status, count in orders_by_status_result.all()}

    tasks_by_priority_result = await db.execute(
        select(Task.priority, func.count(Task.id))
        .where(and_(Task.user_id == user_id, Task.completed == False))
        .group_by(Task.priority)
    )
    tasks_by_priority = {priority: count for priority, count in tasks_by_priority_result.all()}

    return DashboardStatsResponse(
        total_crops=total_crops,
        pending_tasks=pending_tasks,
        total_revenue=total_revenue,
        active_plants=active_plants,
        active_orders=active_orders,
        completed_orders=completed_orders,
        overdue_tasks=overdue_tasks,
        recent_grafts=recent_grafts,
        recent_transfers=recent_transfers,
        crops_by_stage=crops_by_stage,
        orders_by_status=orders_by_status,
        tasks_by_priority=tasks_by_priority
    )


@router.get("/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db),
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y")
):
    """
    Get performance metrics for specified period
    """
    user_id = current_user.id

    # Calculate date range
    end_date = date.today()
    if date_range == "7d":
        start_date = end_date - timedelta(days=7)
    elif date_range == "30d":
        start_date = end_date - timedelta(days=30)
    elif date_range == "90d":
        start_date = end_date - timedelta(days=90)
    elif date_range == "1y":
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=30)

    # Productivity metrics
    crops_planted_count = await db.execute(
        select(func.count(Crop.id)).where(
            and_(
                Crop.user_id == user_id,
                Crop.planted_date >= start_date,
                Crop.planted_date <= end_date
            )
        )
    )
    crops_planted = crops_planted_count.scalar()

    orders_created_count = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        )
    )
    orders_created = orders_created_count.scalar()

    orders_completed_count = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                Order.status.in_(["completed", "delivered"]),
                Order.updated_at >= datetime.combine(start_date, datetime.min.time()),
                Order.updated_at <= datetime.combine(end_date, datetime.max.time())
            )
        )
    )
    orders_completed = orders_completed_count.scalar()

    tasks_completed_count = await db.execute(
        select(func.count(Task.id)).where(
            and_(
                Task.user_id == user_id,
                Task.completed == True,
                Task.updated_at >= datetime.combine(start_date, datetime.min.time()),
                Task.updated_at <= datetime.combine(end_date, datetime.max.time())
            )
        )
    )
    tasks_completed = tasks_completed_count.scalar()

    # Success rates
    grafting_success_result = await db.execute(
        select(func.avg(GraftingRecord.success_rate)).where(
            and_(
                GraftingRecord.user_id == user_id,
                GraftingRecord.date >= start_date,
                GraftingRecord.date <= end_date
            )
        )
    )
    grafting_success_rate = float(grafting_success_result.scalar() or 0)

    transfer_survival_result = await db.execute(
        select(func.avg(TransferRecord.survival_rate)).where(
            and_(
                TransferRecord.user_id == user_id,
                TransferRecord.transfer_date >= start_date,
                TransferRecord.transfer_date <= end_date,
                TransferRecord.survival_rate.isnot(None)
            )
        )
    )
    transfer_survival_rate = float(transfer_survival_result.scalar() or 0)

    # Order completion rate
    total_orders_in_period = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        )
    )
    total_orders = total_orders_in_period.scalar()
    order_completion_rate = (orders_completed / total_orders * 100) if total_orders > 0 else 0

    # Average completion times (simplified - would need more complex queries for real data)
    avg_order_completion_days = 45.0  # Placeholder
    avg_task_completion_days = 3.0    # Placeholder

    # Generate daily/weekly metrics (simplified)
    daily_metrics = []
    weekly_metrics = []

    return PerformanceMetricsResponse(
        period=date_range,
        date_range={"start": start_date, "end": end_date},
        crops_planted=crops_planted,
        orders_created=orders_created,
        orders_completed=orders_completed,
        tasks_completed=tasks_completed,
        grafting_success_rate=grafting_success_rate,
        transfer_survival_rate=transfer_survival_rate,
        order_completion_rate=order_completion_rate,
        avg_order_completion_days=avg_order_completion_days,
        avg_task_completion_days=avg_task_completion_days,
        daily_metrics=daily_metrics,
        weekly_metrics=weekly_metrics
    )


@router.get("/success-rates", response_model=SuccessRateAnalysisResponse)
async def get_success_rate_analysis(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive success rate analysis
    """
    user_id = current_user.id

    # Overall statistics
    overall_grafting_result = await db.execute(
        select(func.avg(GraftingRecord.success_rate)).where(
            GraftingRecord.user_id == user_id
        )
    )
    overall_grafting_success = float(overall_grafting_result.scalar() or 0)

    overall_transfer_result = await db.execute(
        select(func.avg(TransferRecord.survival_rate)).where(
            and_(
                TransferRecord.user_id == user_id,
                TransferRecord.survival_rate.isnot(None)
            )
        )
    )
    overall_transfer_survival = float(overall_transfer_result.scalar() or 0)

    overall_stats = {
        "grafting_success_rate": overall_grafting_success,
        "transfer_survival_rate": overall_transfer_survival
    }

    # By propagation method (from crops)
    method_result = await db.execute(
        select(Crop.propagation_method, func.count(Crop.id))
        .where(Crop.user_id == user_id)
        .group_by(Crop.propagation_method)
    )
    by_propagation_method = {
        method: {"count": count, "success_rate": 85.0}  # Placeholder
        for method, count in method_result.all()
    }

    # By variety (grafting success)
    variety_result = await db.execute(
        select(
            GraftingRecord.scion_variety,
            func.avg(GraftingRecord.success_rate),
            func.sum(GraftingRecord.quantity)
        )
        .where(GraftingRecord.user_id == user_id)
        .group_by(GraftingRecord.scion_variety)
    )
    by_variety = {
        variety: {"count": count, "success_rate": float(success_rate)}
        for variety, success_rate, count in variety_result.all()
    }

    # By grafting technique
    technique_result = await db.execute(
        select(
            GraftingRecord.technique,
            func.avg(GraftingRecord.success_rate),
            func.sum(GraftingRecord.quantity)
        )
        .where(GraftingRecord.user_id == user_id)
        .group_by(GraftingRecord.technique)
    )
    by_grafting_technique = {
        technique: {"count": count, "success_rate": float(success_rate)}
        for technique, success_rate, count in technique_result.all()
    }

    # By operator
    operator_result = await db.execute(
        select(
            GraftingRecord.operator,
            func.avg(GraftingRecord.success_rate),
            func.sum(GraftingRecord.quantity)
        )
        .where(GraftingRecord.user_id == user_id)
        .group_by(GraftingRecord.operator)
    )
    by_operator = {
        operator: {"count": count, "success_rate": float(success_rate)}
        for operator, success_rate, count in operator_result.all()
    }

    # Time trends (simplified)
    monthly_trends = []
    quarterly_trends = []

    return SuccessRateAnalysisResponse(
        overall_stats=overall_stats,
        by_propagation_method=by_propagation_method,
        by_variety=by_variety,
        by_grafting_technique=by_grafting_technique,
        by_operator=by_operator,
        monthly_trends=monthly_trends,
        quarterly_trends=quarterly_trends
    )


@router.get("/stage-distribution", response_model=StageDistributionResponse)
async def get_stage_distribution(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get distribution of crops/orders by stage
    """
    user_id = current_user.id

    # Crop stages
    crop_stages_result = await db.execute(
        select(Crop.current_stage, func.count(Crop.id))
        .where(Crop.user_id == user_id)
        .group_by(Crop.current_stage)
    )
    crop_stages = {stage: count for stage, count in crop_stages_result.all()}

    # Order stages
    order_stages_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.user_id == user_id)
        .group_by(Order.status)
    )
    order_stages = {stage: count for stage, count in order_stages_result.all()}

    # Average stage duration (placeholder - would need more complex analysis)
    average_stage_duration = {
        "planted": 7.0,
        "germinated": 14.0,
        "seedling": 21.0,
        "transplanted": 30.0
    }

    # Stage bottlenecks (placeholder)
    stage_bottlenecks = [
        {"stage": "germination", "avg_duration": 10.5, "expected_duration": 7.0},
        {"stage": "transplanting", "avg_duration": 35.0, "expected_duration": 30.0}
    ]

    # Section capacity (placeholder)
    section_capacity = {
        "greenhouse": {"current": 150, "capacity": 200},
        "nursery": {"current": 300, "capacity": 500},
        "field": {"current": 1000, "capacity": 2000}
    }

    return StageDistributionResponse(
        crop_stages=crop_stages,
        order_stages=order_stages,
        average_stage_duration=average_stage_duration,
        stage_bottlenecks=stage_bottlenecks,
        section_capacity=section_capacity
    )