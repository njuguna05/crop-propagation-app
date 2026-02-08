from typing import Dict, List, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order


async def validate_stage_requirements(order: Order, db: AsyncSession) -> Dict[str, Any]:
    """
    Validate if an order meets requirements for its current stage

    Args:
        order: Order instance to validate
        db: Database session

    Returns:
        Dictionary with validation results
    """

    blockers = []
    warnings = []
    requirements_met = True

    # Check basic requirements
    quantity_check = validate_quantity_requirements(order)
    if not quantity_check["valid"]:
        blockers.extend(quantity_check["blockers"])

    # Check worker assignments
    worker_check = validate_worker_assignments(order)
    if not worker_check["valid"]:
        blockers.extend(worker_check["blockers"])

    # Check environmental requirements
    environmental_check = validate_environmental_requirements(order)
    if not environmental_check["valid"]:
        blockers.extend(environmental_check["blockers"])

    # Check timing requirements
    timing_check = validate_timing_requirements(order)
    if not timing_check["valid"]:
        blockers.extend(timing_check["blockers"])

    # Check stage-specific requirements
    stage_check = await validate_stage_specific_requirements(order, db)
    if not stage_check["valid"]:
        blockers.extend(stage_check["blockers"])

    # Determine overall status
    critical_blockers = [b for b in blockers if b.get("severity") == "critical"]
    requirements_met = len(critical_blockers) == 0

    return {
        "currentStageComplete": requirements_met,
        "readyForNextStage": requirements_met,
        "blockers": blockers,
        "warnings": warnings,
        "recommendations": generate_recommendations(order, blockers),
        "validation_summary": {
            "total_checks": 5,
            "passed_checks": sum([
                quantity_check["valid"],
                worker_check["valid"],
                environmental_check["valid"],
                timing_check["valid"],
                stage_check["valid"]
            ]),
            "critical_issues": len(critical_blockers),
            "warnings": len(warnings)
        }
    }


def validate_quantity_requirements(order: Order) -> Dict[str, Any]:
    """Validate quantity-related requirements"""

    blockers = []
    valid = True

    if order.current_stage_quantity <= 0:
        blockers.append({
            "type": "quantity",
            "message": "No plants available in current stage",
            "severity": "critical",
            "action": "Check previous stage for plant losses or transfer issues"
        })
        valid = False

    # Check for significant quantity loss
    if order.total_quantity > 0:
        loss_percentage = ((order.total_quantity - order.current_stage_quantity) / order.total_quantity) * 100
        if loss_percentage > 30:
            blockers.append({
                "type": "quantity",
                "message": f"High plant loss detected ({loss_percentage:.1f}%)",
                "severity": "warning",
                "action": "Review previous stages for quality issues"
            })

    return {"valid": valid, "blockers": blockers}


def validate_worker_assignments(order: Order) -> Dict[str, Any]:
    """Validate worker assignment requirements"""

    blockers = []
    valid = True

    if not order.worker_assignments:
        blockers.append({
            "type": "worker",
            "message": "No workers assigned to this order",
            "severity": "warning",
            "action": "Assign qualified workers to each stage"
        })
        return {"valid": False, "blockers": blockers}

    # Check stage-specific worker requirements
    stage_worker_map = {
        "budwood_collection": "budwoodCollector",
        "grafting_operation": "grafter",
        "post_graft_care": "nurseryManager",
        "quality_check": "qualityController"
    }

    required_worker_key = stage_worker_map.get(order.status)
    if required_worker_key:
        assigned_worker = order.worker_assignments.get(required_worker_key)
        if not assigned_worker:
            blockers.append({
                "type": "worker",
                "message": f"No {required_worker_key} assigned for {order.status}",
                "severity": "critical",
                "action": f"Assign a qualified {required_worker_key} to this order"
            })
            valid = False

    return {"valid": valid, "blockers": blockers}


def validate_environmental_requirements(order: Order) -> Dict[str, Any]:
    """Validate environmental requirements for the current stage"""

    blockers = []
    valid = True

    # Define stage-specific environmental requirements
    environmental_requirements = {
        "budwood_collection": {
            "temperature_range": (15, 25),
            "humidity_range": (60, 80),
            "requirements": ["Cool, dry conditions", "Sterilized collection tools"]
        },
        "grafting_operation": {
            "temperature_range": (20, 25),
            "humidity_range": (85, 95),
            "requirements": ["High humidity chamber", "Sterile environment"]
        },
        "post_graft_care": {
            "temperature_range": (20, 25),
            "humidity_range": (85, 95),
            "requirements": ["Controlled humidity", "Filtered air"]
        },
        "hardening": {
            "temperature_range": (18, 28),
            "humidity_range": (50, 70),
            "requirements": ["Gradual acclimatization", "Natural light exposure"]
        }
    }

    stage_requirements = environmental_requirements.get(order.status)
    if stage_requirements:
        # In a real implementation, you'd check actual environmental data
        # For now, we'll simulate some checks

        # Mock environmental validation - in practice, this would check sensors
        current_conditions_available = False  # Simulate missing environmental data

        if not current_conditions_available:
            blockers.append({
                "type": "environment",
                "message": f"Environmental conditions not monitored for {order.status}",
                "severity": "warning",
                "action": "Install environmental monitoring or verify conditions manually"
            })

    return {"valid": valid, "blockers": blockers}


def validate_timing_requirements(order: Order) -> Dict[str, Any]:
    """Validate timing requirements for the current stage"""

    blockers = []
    valid = True

    # Define typical stage durations (in days)
    stage_durations = {
        "budwood_collection": {"min": 1, "max": 2},
        "grafting_setup": {"min": 1, "max": 1},
        "grafting_operation": {"min": 1, "max": 3},
        "post_graft_care": {"min": 14, "max": 21},
        "quality_check": {"min": 1, "max": 2},
        "hardening": {"min": 7, "max": 14},
        "pre_dispatch": {"min": 1, "max": 3}
    }

    # Find the current stage start date from stage history
    stage_start_date = None
    if order.stage_history:
        for entry in reversed(order.stage_history):
            if entry.get("stage") == order.status:
                stage_start_date = datetime.fromisoformat(entry["date"]).date()
                break

    if stage_start_date:
        days_in_stage = (datetime.now().date() - stage_start_date).days
        stage_duration = stage_durations.get(order.status)

        if stage_duration:
            if days_in_stage < stage_duration["min"]:
                blockers.append({
                    "type": "timing",
                    "message": f"Minimum stage duration not met ({days_in_stage}/{stage_duration['min']} days)",
                    "severity": "warning",
                    "action": "Allow more time for proper development"
                })

            elif days_in_stage > stage_duration["max"] * 1.5:
                blockers.append({
                    "type": "timing",
                    "message": f"Stage overdue ({days_in_stage}/{stage_duration['max']} days)",
                    "severity": "critical",
                    "action": "Immediate action required to prevent losses"
                })
                valid = False

    # Check delivery deadline
    if order.requested_delivery:
        days_to_delivery = (order.requested_delivery - datetime.now().date()).days
        if days_to_delivery < 0:
            blockers.append({
                "type": "timing",
                "message": f"Order is {abs(days_to_delivery)} days overdue",
                "severity": "critical",
                "action": "Expedite processing or notify client of delay"
            })
            valid = False

    return {"valid": valid, "blockers": blockers}


async def validate_stage_specific_requirements(order: Order, db: AsyncSession) -> Dict[str, Any]:
    """Validate requirements specific to the current stage"""

    blockers = []
    valid = True

    # Stage-specific validations
    if order.status == "grafting_operation":
        # Check budwood availability
        if not order.budwood_calculation:
            blockers.append({
                "type": "material",
                "message": "Budwood calculation not completed",
                "severity": "critical",
                "action": "Calculate and verify budwood requirements"
            })
            valid = False
        elif order.budwood_calculation.get("total_required", 0) <= 0:
            blockers.append({
                "type": "material",
                "message": "No budwood allocated for grafting",
                "severity": "critical",
                "action": "Ensure adequate budwood supply"
            })
            valid = False

    elif order.status == "quality_check":
        # Check if quality controller is assigned
        quality_controller = order.worker_assignments.get("qualityController") if order.worker_assignments else None
        if not quality_controller:
            blockers.append({
                "type": "worker",
                "message": "No quality controller assigned",
                "severity": "critical",
                "action": "Assign certified quality controller"
            })
            valid = False

    elif order.status == "pre_dispatch":
        # Check packaging and shipping requirements
        if not order.specifications.get("containerSize"):
            blockers.append({
                "type": "packaging",
                "message": "Container size not specified",
                "severity": "warning",
                "action": "Confirm packaging requirements with client"
            })

    return {"valid": valid, "blockers": blockers}


def generate_recommendations(order: Order, blockers: List[Dict]) -> List[str]:
    """Generate actionable recommendations based on validation results"""

    recommendations = []

    # General recommendations based on blocker types
    blocker_types = set(blocker.get("type") for blocker in blockers)

    if "quantity" in blocker_types:
        recommendations.append("Review plant health management protocols")
        recommendations.append("Consider increasing initial quantities to account for losses")

    if "worker" in blocker_types:
        recommendations.append("Ensure proper worker training and certification")
        recommendations.append("Maintain backup worker assignments for critical stages")

    if "timing" in blocker_types:
        recommendations.append("Review and optimize stage duration planning")
        recommendations.append("Implement early warning system for deadline management")

    if "environment" in blocker_types:
        recommendations.append("Install comprehensive environmental monitoring")
        recommendations.append("Establish automated alerts for out-of-range conditions")

    # Stage-specific recommendations
    stage_recommendations = {
        "grafting_operation": [
            "Maintain optimal humidity levels during grafting",
            "Use sterilized tools and work surfaces"
        ],
        "post_graft_care": [
            "Monitor graft union development closely",
            "Maintain consistent temperature and humidity"
        ],
        "quality_check": [
            "Document all quality assessments",
            "Remove any failed grafts to maintain nursery health"
        ]
    }

    stage_specific = stage_recommendations.get(order.status, [])
    recommendations.extend(stage_specific)

    # Remove duplicates and return
    return list(set(recommendations))