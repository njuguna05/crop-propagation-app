#!/usr/bin/env python3
"""
Simple FastAPI server for crop propagation app
"""
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(
    title="Crop Propagation API",
    description="FastAPI backend for crop propagation management",
    version="1.0.0"
)

# Simple in-memory storage for demo
stored_orders = []
stored_tasks = []

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple test endpoints
@app.get("/")
async def root():
    return {"message": "Crop Propagation API", "status": "running", "timestamp": datetime.now()}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now()}

# Simple auth endpoint
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/v1/auth/login")
async def login(credentials: LoginRequest):
    # Simple mock authentication
    if credentials.username == "admin" and credentials.password == "admin":
        return {
            "access_token": "mock-jwt-token-123",
            "refresh_token": "mock-refresh-token-456",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Administrator"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/v1/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Administrator",
        "is_active": True
    }

# Mock endpoints for basic functionality
@app.get("/api/v1/crops")
async def get_crops():
    return [
        {
            "id": 1,
            "name": "Tomato",
            "variety": "Cherry",
            "current_stage": "germinated",
            "planted_date": "2024-01-15",
            "temperature": 22,
            "humidity": 65,
            "created_at": "2024-01-15T10:00:00",
            "updated_at": "2024-01-20T14:30:00"
        }
    ]

@app.get("/api/v1/tasks")
async def get_tasks():
    # Return mock data plus any stored tasks
    mock_tasks = [
        {
            "id": 1,
            "task": "Water seedlings",
            "due_date": "2024-01-25",
            "completed": False,
            "priority": "high",
            "created_at": "2024-01-20T09:00:00"
        }
    ]
    return mock_tasks + stored_tasks

class TaskCreate(BaseModel):
    task: str
    cropId: int
    dueDate: str
    priority: str = "medium"

@app.post("/api/v1/tasks")
async def create_task(task_data: TaskCreate):
    # Simple mock task creation
    return {
        "id": 2,
        "task": task_data.task,
        "cropId": task_data.cropId,
        "dueDate": task_data.dueDate,
        "priority": task_data.priority,
        "completed": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

@app.get("/api/v1/orders")
async def get_orders():
    # Return mock data plus any stored orders
    mock_orders = [
        {
            "id": "PO-2024-001",
            "order_number": "PO-2024-001",
            "status": "in_propagation",
            "client_name": "Green Gardens Inc",
            "crop_type": "Vegetables",
            "variety": "Tomato Cherry",
            "total_quantity": 1000,
            "current_stage_quantity": 850,
            "order_date": "2024-01-10",
            "created_at": "2024-01-10T08:00:00"
        }
    ]
    return mock_orders + stored_orders

class OrderCreate(BaseModel):
    clientName: str
    contactPerson: str = ""
    phone: str = ""
    email: str = ""
    requestedDelivery: str
    cropType: str
    variety: str
    quantity: int
    propagationMethod: str = "seed"
    unitPrice: float = 0.0
    notes: str = ""

@app.post("/api/v1/orders")
async def create_order(order_data: OrderCreate):
    # Generate order number
    import random
    order_number = f"PO-{datetime.now().year}-{random.randint(100, 999)}"

    new_order = {
        "id": order_number,
        "order_number": order_number,
        "status": "order_created",
        "client_name": order_data.clientName,
        "contact_person": order_data.contactPerson,
        "phone": order_data.phone,
        "email": order_data.email,
        "requested_delivery": order_data.requestedDelivery,
        "crop_type": order_data.cropType,
        "variety": order_data.variety,
        "total_quantity": order_data.quantity,
        "current_stage_quantity": 0,
        "propagation_method": order_data.propagationMethod,
        "unit_price": order_data.unitPrice,
        "total_value": order_data.quantity * order_data.unitPrice,
        "notes": order_data.notes,
        "order_date": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    # Store the order in memory
    stored_orders.append(new_order)

    return new_order

# Also add endpoints without api/v1 prefix for compatibility
@app.get("/orders")
async def get_orders_compat():
    return await get_orders()

@app.post("/orders")
async def create_order_compat(order_data: OrderCreate):
    return await create_order(order_data)

@app.get("/api/v1/analytics/dashboard")
async def get_dashboard_stats():
    # Calculate real stats from stored data
    total_orders = len(stored_orders) + 1  # +1 for mock order
    total_tasks = len(stored_tasks) + 1    # +1 for mock task

    # Calculate total revenue from stored orders
    stored_revenue = sum(order.get('total_value', 0) for order in stored_orders)
    total_revenue = stored_revenue + 1250.0  # Add mock order value

    # Calculate active plants from orders
    active_plants = sum(order.get('total_quantity', 0) for order in stored_orders) + 1000  # Add mock order quantity

    # Orders by status analysis
    orders_by_status = {"order_created": 0, "in_propagation": 1, "ready_for_delivery": 0}  # Start with mock order
    for order in stored_orders:
        status = order.get('status', 'order_created')
        orders_by_status[status] = orders_by_status.get(status, 0) + 1

    # Tasks by priority analysis
    tasks_by_priority = {"low": 0, "medium": 1, "high": 0}  # Start with mock task
    for task in stored_tasks:
        priority = task.get('priority', 'medium')
        tasks_by_priority[priority] = tasks_by_priority.get(priority, 0) + 1

    # Calculate completion rates and trends
    completed_orders = sum(1 for order in stored_orders if order.get('status') == 'completed')
    pending_tasks_count = sum(1 for task in stored_tasks if not task.get('completed', False)) + 1  # +1 for mock

    return {
        "total_crops": 5,  # Based on current mock data structure
        "pending_tasks": pending_tasks_count,
        "total_revenue": round(total_revenue, 2),
        "active_plants": active_plants,
        "active_orders": total_orders,
        "completed_orders": completed_orders,
        "overdue_tasks": 0,  # Would need date comparison logic
        "recent_grafts": 0,   # No grafting data yet
        "recent_transfers": 0, # No transfer data yet
        "crops_by_stage": {
            "planted": 1,
            "germinated": 2,
            "seedling": 1,
            "transplanted": 1
        },
        "orders_by_status": orders_by_status,
        "tasks_by_priority": tasks_by_priority,
        "growth_metrics": {
            "monthly_revenue": round(total_revenue, 2),
            "order_fulfillment_rate": round((completed_orders / max(total_orders, 1)) * 100, 1),
            "average_order_value": round(total_revenue / max(total_orders, 1), 2),
            "task_completion_rate": round(((total_tasks - pending_tasks_count) / max(total_tasks, 1)) * 100, 1)
        },
        "recent_activity": [
            {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "activity": f"{len(stored_orders)} new orders created",
                "type": "order"
            },
            {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "activity": f"{len(stored_tasks)} new tasks added",
                "type": "task"
            }
        ]
    }

@app.get("/api/v1/analytics/performance")
async def get_performance_metrics():
    """Get performance metrics and trends"""
    total_orders = len(stored_orders) + 1
    total_revenue = sum(order.get('total_value', 0) for order in stored_orders) + 1250.0

    # Generate sample monthly data for trends
    monthly_data = []
    for i in range(6):
        month = (datetime.now().month - i) % 12 + 1
        year = datetime.now().year if month <= datetime.now().month else datetime.now().year - 1
        monthly_data.append({
            "month": f"{year}-{month:02d}",
            "revenue": round(total_revenue * (0.7 + i * 0.1), 2),
            "orders": max(1, total_orders - i),
            "plants_produced": max(100, (total_orders - i) * 200)
        })

    return {
        "trends": {
            "monthly_data": monthly_data[::-1],  # Reverse to show chronological order
            "revenue_growth": 15.5,  # Percentage
            "order_growth": 12.3,
            "plant_production_growth": 8.7
        },
        "efficiency_metrics": {
            "average_propagation_time": 14,  # days
            "success_rate": 92.5,  # percentage
            "cost_per_plant": 2.15,
            "plants_per_sqm": 25
        },
        "seasonal_trends": {
            "spring": {"orders": 45, "success_rate": 95},
            "summer": {"orders": 38, "success_rate": 88},
            "autumn": {"orders": 42, "success_rate": 90},
            "winter": {"orders": 25, "success_rate": 85}
        }
    }

@app.get("/api/v1/analytics/success-rates")
async def get_success_rate_analysis():
    """Get detailed success rate analysis"""
    return {
        "overall_success_rate": 92.5,
        "by_propagation_method": {
            "seed": {"success_rate": 95.2, "total_attempts": 1250},
            "cutting": {"success_rate": 89.8, "total_attempts": 856},
            "graft": {"success_rate": 87.3, "total_attempts": 432},
            "division": {"success_rate": 96.1, "total_attempts": 234}
        },
        "by_crop_type": {
            "vegetables": {"success_rate": 94.1, "total_attempts": 980},
            "herbs": {"success_rate": 91.7, "total_attempts": 654},
            "flowers": {"success_rate": 88.9, "total_attempts": 567},
            "fruits": {"success_rate": 89.2, "total_attempts": 321},
            "trees": {"success_rate": 85.6, "total_attempts": 250}
        },
        "by_season": {
            "spring": 95.2,
            "summer": 88.4,
            "autumn": 90.1,
            "winter": 85.7
        },
        "factors_affecting_success": [
            {"factor": "Temperature Control", "impact": 8.5},
            {"factor": "Humidity Management", "impact": 7.2},
            {"factor": "Soil Quality", "impact": 6.8},
            {"factor": "Timing", "impact": 5.4},
            {"factor": "Experience Level", "impact": 4.9}
        ]
    }

@app.get("/budwood")
async def get_budwood_collection():
    return []

@app.get("/grafting")
async def get_grafting_collection():
    return []

@app.get("/transfers")
async def get_transfer_collection():
    return []

@app.get("/api/v1/budwood")
async def get_budwood_collection_v1():
    return []

@app.get("/api/v1/grafting")
async def get_grafting_records():
    return []

@app.get("/api/v1/transfers")
async def get_transfer_records():
    return []

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)