from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum


class PropagationMethod(str, Enum):
    GRAFTING = "grafting"
    CUTTING = "cutting"
    TISSUE_CULTURE = "tissue_culture"
    SEED = "seed"


class OrderStatus(str, Enum):
    ORDER_CREATED = "order_created"
    BUDWOOD_COLLECTION = "budwood_collection"
    GRAFTING_SETUP = "grafting_setup"
    GRAFTING_OPERATION = "grafting_operation"
    POST_GRAFT_CARE = "post_graft_care"
    QUALITY_CHECK = "quality_check"
    HARDENING = "hardening"
    PRE_DISPATCH = "pre_dispatch"
    DISPATCHED = "dispatched"


class BlockerSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class WorkerAssignments(BaseModel):
    budwood_collector: Optional[str] = None
    grafter: Optional[str] = None
    nursery_manager: Optional[str] = None
    quality_controller: Optional[str] = None


class BudwoodCalculation(BaseModel):
    required_budwood: int = Field(..., description="Base budwood pieces required")
    waste_factor_percent: float = Field(15.0, description="Waste factor percentage")
    extra_for_safety: int = Field(0, description="Extra budwood for safety buffer")
    total_required: int = Field(..., description="Total budwood pieces needed")


class StageBlocker(BaseModel):
    type: str = Field(..., description="Type of blocker")
    message: str = Field(..., description="Blocker description")
    severity: BlockerSeverity = Field(..., description="Severity level")
    action: str = Field(..., description="Recommended action")


class StageValidation(BaseModel):
    current_stage_complete: bool = Field(..., description="Is current stage complete")
    ready_for_next_stage: bool = Field(..., description="Ready for next stage")
    blockers: List[StageBlocker] = Field(default_factory=list, description="List of blockers")


class WorkerPerformance(BaseModel):
    time_in_stage: Optional[int] = Field(None, description="Time spent in stage (days)")
    quality_score: Optional[float] = Field(None, description="Quality score (0-100)")
    efficiency_rating: Optional[float] = Field(None, description="Efficiency rating (0-100)")


class StageHistoryEntry(BaseModel):
    stage: str = Field(..., description="Stage name")
    date: date = Field(..., description="Stage date")
    quantity: int = Field(..., description="Quantity at this stage")
    operator: Optional[str] = Field(None, description="Operator responsible")
    notes: Optional[str] = Field(None, description="Stage notes")
    worker_performance: Optional[WorkerPerformance] = None


class EnhancedOrderBase(BaseModel):
    order_number: str = Field(..., description="Order number")
    client_name: str = Field(..., description="Client name")
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    crop_type: str = Field(..., description="Type of crop")
    variety: str = Field(..., description="Crop variety")
    propagation_method: PropagationMethod = Field(..., description="Propagation method")

    total_quantity: int = Field(..., gt=0, description="Total quantity ordered")
    unit_price: Optional[float] = Field(None, ge=0, description="Price per unit")
    priority: str = Field("medium", description="Order priority")

    requested_delivery: Optional[date] = None
    notes: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    specifications: Optional[Dict[str, Any]] = Field(default_factory=dict)

    # Enhanced features
    budwood_calculation: Optional[BudwoodCalculation] = None
    worker_assignments: Optional[WorkerAssignments] = None
    stage_validation: Optional[StageValidation] = None


class EnhancedOrderCreate(EnhancedOrderBase):
    pass


class EnhancedOrderUpdate(BaseModel):
    client_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    crop_type: Optional[str] = None
    variety: Optional[str] = None
    propagation_method: Optional[PropagationMethod] = None

    total_quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, ge=0)
    priority: Optional[str] = None

    requested_delivery: Optional[date] = None
    notes: Optional[List[Dict[str, Any]]] = None
    specifications: Optional[Dict[str, Any]] = None

    # Enhanced features
    budwood_calculation: Optional[BudwoodCalculation] = None
    worker_assignments: Optional[WorkerAssignments] = None
    stage_validation: Optional[StageValidation] = None


class EnhancedOrderResponse(EnhancedOrderBase):
    id: str
    status: OrderStatus
    current_section: Optional[str] = None

    order_date: date
    completed_quantity: int = 0
    current_stage_quantity: int
    total_value: Optional[float] = None

    stage_history: List[StageHistoryEntry] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Request/Response models for specific endpoints
class TransferRequest(BaseModel):
    to_stage: OrderStatus = Field(..., description="Target stage")
    to_section: str = Field(..., description="Target section")
    quantity: int = Field(..., gt=0, description="Quantity to transfer")
    operator: str = Field(..., description="Operator performing transfer")
    transfer_date: Optional[date] = None
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    time_in_previous_stage: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class HealthAssessmentRequest(BaseModel):
    lost_quantity: int = Field(..., ge=0, description="Number of plants lost")
    operator: str = Field(..., description="Operator conducting assessment")
    assessment_type: str = Field("routine", description="Type of assessment")
    notes: Optional[str] = None


class BudwoodCalculationRequest(BaseModel):
    quantity: int = Field(..., gt=0, description="Order quantity")
    propagation_method: PropagationMethod = Field(..., description="Propagation method")
    waste_factor_percent: float = Field(15.0, ge=0, le=50, description="Waste factor percentage")
    extra_for_safety: int = Field(0, ge=0, description="Extra safety buffer")


class BudwoodCalculationResponse(BudwoodCalculation):
    pass


class StageValidationResponse(BaseModel):
    order_id: str
    stage: str
    current_stage_complete: bool
    ready_for_next_stage: bool
    blockers: List[StageBlocker]
    validation_date: datetime
    recommendations: List[str] = Field(default_factory=list)


class WorkerPerformanceResponse(BaseModel):
    worker_name: str
    stage: str
    date: date
    quantity_processed: int
    quality_score: Optional[float] = None
    efficiency_rating: Optional[float] = None
    time_in_stage: Optional[int] = None


# Analytics response models
class WorkerAnalytics(BaseModel):
    worker_name: str
    total_tasks: int
    avg_quality_score: float
    avg_efficiency_rating: float
    total_quantity_processed: int
    stages_worked: List[str]


class StageAnalytics(BaseModel):
    stage: str
    total_orders: int
    avg_time_in_stage: float
    avg_survival_rate: float
    common_issues: List[str]


class DispatchAnalytics(BaseModel):
    total_dispatched: int
    on_time_deliveries: int
    avg_dispatch_time_days: float
    ready_for_dispatch: int


class VarietyAnalytics(BaseModel):
    variety: str
    total_orders: int
    total_quantity: int
    avg_success_rate: float
    total_revenue: float


class ComprehensiveAnalytics(BaseModel):
    summary: Dict[str, Any]
    workers: List[WorkerAnalytics]
    stages: List[StageAnalytics]
    dispatch: DispatchAnalytics
    varieties: List[VarietyAnalytics]
    trends: Dict[str, List[Dict[str, Any]]]