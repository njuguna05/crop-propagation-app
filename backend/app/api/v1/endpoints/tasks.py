from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.task import Task
from app.models.crop import Crop
from app.models.order import Order
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskCompletion, TaskStats
from app.schemas.common import MessageResponse
from app.dependencies import CurrentUserDep


router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get tasks updated since this timestamp"),
    crop_id: Optional[int] = Query(None, description="Filter by crop ID"),
    order_id: Optional[str] = Query(None, description="Filter by order ID"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    due_date: Optional[date] = Query(None, description="Filter by due date"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get tasks with filtering options and incremental sync support
    """
    query = select(Task).where(Task.user_id == current_user.id)

    # Add filters
    if since:
        query = query.where(Task.updated_at > since)
    if crop_id:
        query = query.where(Task.crop_id == crop_id)
    if order_id:
        query = query.where(Task.order_id == order_id)
    if completed is not None:
        query = query.where(Task.completed == completed)
    if due_date:
        query = query.where(Task.due_date == due_date)
    if priority:
        query = query.where(Task.priority == priority)

    # Add pagination and ordering
    query = query.offset(skip).limit(limit).order_by(Task.due_date.asc(), Task.priority.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    return tasks


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task
    """
    # Validate crop_id exists and belongs to user
    if task_data.crop_id:
        crop_result = await db.execute(
            select(Crop).where(
                and_(Crop.id == task_data.crop_id, Crop.user_id == current_user.id)
            )
        )
        if not crop_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Crop not found or not accessible"
            )

    # Validate order_id exists and belongs to user
    if task_data.order_id:
        order_result = await db.execute(
            select(Order).where(
                and_(Order.id == task_data.order_id, Order.user_id == current_user.id)
            )
        )
        if not order_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order not found or not accessible"
            )

    # Create task instance
    db_task = Task(
        user_id=current_user.id,
        **task_data.model_dump()
    )

    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific task by ID
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        ).options(selectinload(Task.crop), selectinload(Task.order))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Update task details
    """
    # Get existing task
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Validate crop_id if being updated
    if task_update.crop_id and task_update.crop_id != task.crop_id:
        crop_result = await db.execute(
            select(Crop).where(
                and_(Crop.id == task_update.crop_id, Crop.user_id == current_user.id)
            )
        )
        if not crop_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Crop not found or not accessible"
            )

    # Validate order_id if being updated
    if task_update.order_id and task_update.order_id != task.order_id:
        order_result = await db.execute(
            select(Order).where(
                and_(Order.id == task_update.order_id, Order.user_id == current_user.id)
            )
        )
        if not order_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order not found or not accessible"
            )

    # Update task fields
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_completion(
    task_id: int,
    completion: TaskCompletion,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle task completion status
    """
    # Get existing task
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update completion status
    task.completed = completion.completed

    await db.commit()
    await db.refresh(task)

    return task


@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: int,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a task
    """
    # Get existing task
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    await db.delete(task)
    await db.commit()

    return MessageResponse(message="Task deleted successfully")


@router.get("/stats/overview", response_model=TaskStats)
async def get_task_statistics(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get task statistics and overview
    """
    user_filter = Task.user_id == current_user.id

    # Total tasks
    total_result = await db.execute(
        select(func.count(Task.id)).where(user_filter)
    )
    total_tasks = total_result.scalar()

    # Completed tasks
    completed_result = await db.execute(
        select(func.count(Task.id)).where(and_(user_filter, Task.completed == True))
    )
    completed_tasks = completed_result.scalar()

    # Pending tasks
    pending_tasks = total_tasks - completed_tasks

    # Overdue tasks
    today = date.today()
    overdue_result = await db.execute(
        select(func.count(Task.id)).where(
            and_(user_filter, Task.completed == False, Task.due_date < today)
        )
    )
    overdue_tasks = overdue_result.scalar()

    # By priority
    priority_result = await db.execute(
        select(Task.priority, func.count(Task.id))
        .where(user_filter)
        .group_by(Task.priority)
    )
    by_priority = {priority: count for priority, count in priority_result.all()}

    # Today's tasks
    today_result = await db.execute(
        select(func.count(Task.id)).where(
            and_(user_filter, Task.due_date == today, Task.completed == False)
        )
    )
    today_tasks = today_result.scalar()

    # This week's tasks
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    week_result = await db.execute(
        select(func.count(Task.id)).where(
            and_(
                user_filter,
                Task.due_date >= week_start,
                Task.due_date <= week_end,
                Task.completed == False
            )
        )
    )
    this_week_tasks = week_result.scalar()

    return TaskStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        by_priority=by_priority,
        today_tasks=today_tasks,
        this_week_tasks=this_week_tasks
    )