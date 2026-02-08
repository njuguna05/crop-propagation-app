from fastapi import APIRouter
from app.api.v1.endpoints import auth, crops, tasks, orders, records, analytics, sync, customers, suppliers


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(crops.router, prefix="/crops", tags=["crops"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(records.router, prefix="/records", tags=["records"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(sync.router, prefix="/sync", tags=["synchronization"])