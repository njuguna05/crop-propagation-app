from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import date


# Dashboard schemas
class DashboardStatsResponse(BaseModel):
    """Dashboard overview statistics"""
    total_crops: int
    pending_tasks: int
    total_revenue: float
    active_plants: int

    # Additional metrics
    active_orders: int
    completed_orders: int
    overdue_tasks: int
    recent_grafts: int
    recent_transfers: int

    # Distribution data
    crops_by_stage: Dict[str, int]
    orders_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]


class PerformanceMetricsResponse(BaseModel):
    """Performance metrics for specified period"""
    period: str  # "7d", "30d", "90d", "1y"
    date_range: Dict[str, date]  # {"start": date, "end": date}

    # Productivity metrics
    crops_planted: int
    orders_created: int
    orders_completed: int
    tasks_completed: int

    # Success rates
    grafting_success_rate: float
    transfer_survival_rate: float
    order_completion_rate: float

    # Time-based metrics
    avg_order_completion_days: float
    avg_task_completion_days: float

    # Trend data
    daily_metrics: List[Dict[str, Any]]  # Daily breakdown
    weekly_metrics: List[Dict[str, Any]]  # Weekly breakdown


class SuccessRateAnalysisResponse(BaseModel):
    """Propagation success rate analysis"""
    overall_stats: Dict[str, float]

    # By method
    by_propagation_method: Dict[str, Dict[str, float]]

    # By variety
    by_variety: Dict[str, Dict[str, float]]

    # By technique (for grafting)
    by_grafting_technique: Dict[str, Dict[str, float]]

    # By operator
    by_operator: Dict[str, Dict[str, float]]

    # Time trends
    monthly_trends: List[Dict[str, Any]]
    quarterly_trends: List[Dict[str, Any]]


class StageDistributionResponse(BaseModel):
    """Distribution of crops/orders by stage"""
    crop_stages: Dict[str, int]
    order_stages: Dict[str, int]

    # Stage flow analysis
    average_stage_duration: Dict[str, float]  # days in each stage
    stage_bottlenecks: List[Dict[str, Any]]   # stages with longest duration

    # Capacity analysis
    section_capacity: Dict[str, Dict[str, int]]  # section -> {"current": X, "capacity": Y}


# Quality metrics
class QualityMetricsResponse(BaseModel):
    """Quality metrics and assessments"""
    overall_quality_score: float

    # Quality by category
    budwood_quality: Dict[str, float]
    grafting_quality: Dict[str, float]
    transfer_quality: Dict[str, float]

    # Quality trends
    quality_trends: List[Dict[str, Any]]

    # Quality issues
    quality_issues: List[Dict[str, Any]]


# Financial metrics
class FinancialMetricsResponse(BaseModel):
    """Financial performance metrics"""
    total_revenue: float
    total_orders_value: float
    avg_order_value: float

    # Revenue trends
    monthly_revenue: List[Dict[str, Any]]
    revenue_by_crop_type: Dict[str, float]
    revenue_by_client: Dict[str, float]

    # Profitability analysis
    profit_margins: Dict[str, float]
    cost_analysis: Dict[str, float]


# Operational metrics
class OperationalMetricsResponse(BaseModel):
    """Operational efficiency metrics"""
    # Throughput metrics
    daily_throughput: Dict[str, float]
    section_utilization: Dict[str, float]
    operator_efficiency: Dict[str, float]

    # Capacity metrics
    current_capacity: Dict[str, int]
    max_capacity: Dict[str, int]
    capacity_utilization: Dict[str, float]

    # Resource allocation
    resource_allocation: Dict[str, Any]
    bottleneck_analysis: List[Dict[str, Any]]


# Forecasting
class ForecastResponse(BaseModel):
    """Forecasting and predictions"""
    period: str  # "30d", "90d", "1y"

    # Production forecasts
    projected_harvests: List[Dict[str, Any]]
    projected_completions: List[Dict[str, Any]]

    # Resource forecasts
    space_requirements: Dict[str, int]
    labor_requirements: Dict[str, int]

    # Revenue forecasts
    projected_revenue: List[Dict[str, Any]]

    # Risk analysis
    risk_factors: List[Dict[str, Any]]


# Custom analytics request
class AnalyticsRequest(BaseModel):
    """Custom analytics request"""
    metrics: List[str]
    filters: Optional[Dict[str, Any]] = None
    date_range: Optional[Dict[str, date]] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = "sum"  # sum, avg, count, min, max


class AnalyticsResponse(BaseModel):
    """Custom analytics response"""
    request: AnalyticsRequest
    data: List[Dict[str, Any]]
    summary: Dict[str, Any]
    generated_at: date