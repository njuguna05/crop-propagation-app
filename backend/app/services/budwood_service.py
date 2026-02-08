from typing import Dict, Any
import math


def calculate_budwood_requirements(
    quantity: int,
    propagation_method: str,
    waste_factor_percent: float = 15.0,
    extra_for_safety: int = 0
) -> Dict[str, Any]:
    """
    Calculate budwood requirements based on order specifications

    Args:
        quantity: Number of plants to propagate
        propagation_method: Method of propagation (grafting, cutting, etc.)
        waste_factor_percent: Expected waste percentage
        extra_for_safety: Additional safety buffer

    Returns:
        Dictionary with budwood calculation details
    """

    # Base budwood ratios by propagation method
    budwood_ratios = {
        "grafting": 1.2,  # 1.2 budwood pieces per plant
        "cutting": 2.0,   # 2 cuttings per plant
        "tissue_culture": 0.1,  # 0.1 sample per plant (high multiplication)
        "seed": 0.0       # No budwood needed for seeds
    }

    # Get the ratio for the specified method
    ratio = budwood_ratios.get(propagation_method.lower(), 1.2)

    # Calculate base requirement
    required_budwood = math.ceil(quantity * ratio)

    # Apply waste factor
    waste_factor = 1 + (waste_factor_percent / 100)
    with_waste = math.ceil(required_budwood * waste_factor)

    # Add safety buffer
    total_required = with_waste + extra_for_safety

    return {
        "required_budwood": required_budwood,
        "waste_factor_percent": waste_factor_percent,
        "extra_for_safety": extra_for_safety,
        "total_required": total_required,
        "method_ratio": ratio,
        "calculation_details": {
            "base_calculation": f"{quantity} plants × {ratio} ratio = {required_budwood}",
            "with_waste": f"{required_budwood} × {waste_factor} factor = {with_waste}",
            "final_total": f"{with_waste} + {extra_for_safety} safety = {total_required}"
        }
    }


def validate_budwood_availability(
    required_quantity: int,
    variety: str,
    harvest_date: str = None
) -> Dict[str, Any]:
    """
    Validate if sufficient budwood is available

    Args:
        required_quantity: Amount of budwood needed
        variety: Plant variety
        harvest_date: Preferred harvest date

    Returns:
        Dictionary with availability status
    """

    # This would typically query a budwood inventory database
    # For now, return a mock validation

    return {
        "available": True,
        "quantity_available": required_quantity + 50,  # Mock availability
        "quality_grade": "A",
        "estimated_harvest_date": harvest_date,
        "mother_trees_available": 3,
        "storage_locations": ["Cold Room 1", "Cold Room 2"],
        "recommendations": [
            "Harvest 2 days before grafting for optimal freshness",
            "Store at 4°C with 90% humidity",
            "Use within 7 days of harvest"
        ]
    }


def get_budwood_usage_analytics(orders_data: list) -> Dict[str, Any]:
    """
    Analyze budwood usage patterns across orders

    Args:
        orders_data: List of order data with budwood calculations

    Returns:
        Dictionary with usage analytics
    """

    total_budwood_used = 0
    total_plants_produced = 0
    waste_percentages = []
    method_breakdown = {}

    for order in orders_data:
        budwood_calc = order.get("budwood_calculation", {})
        if budwood_calc:
            total_budwood_used += budwood_calc.get("total_required", 0)
            total_plants_produced += order.get("total_quantity", 0)

            waste_percent = budwood_calc.get("waste_factor_percent", 0)
            waste_percentages.append(waste_percent)

            method = order.get("propagation_method", "unknown")
            method_breakdown[method] = method_breakdown.get(method, 0) + 1

    avg_waste_percent = sum(waste_percentages) / len(waste_percentages) if waste_percentages else 0
    efficiency_ratio = total_plants_produced / total_budwood_used if total_budwood_used > 0 else 0

    return {
        "total_budwood_used": total_budwood_used,
        "total_plants_produced": total_plants_produced,
        "avg_waste_percentage": round(avg_waste_percent, 1),
        "efficiency_ratio": round(efficiency_ratio, 2),
        "method_breakdown": method_breakdown,
        "recommendations": [
            f"Average waste rate: {avg_waste_percent:.1f}%",
            f"Efficiency: {efficiency_ratio:.2f} plants per budwood piece",
            "Consider reducing waste factor if consistently under target"
        ]
    }


def optimize_budwood_collection_schedule(orders: list) -> Dict[str, Any]:
    """
    Optimize budwood collection schedule based on pending orders

    Args:
        orders: List of orders requiring budwood

    Returns:
        Dictionary with optimized collection schedule
    """

    collection_schedule = {}
    variety_totals = {}

    for order in orders:
        variety = order.get("variety", "unknown")
        budwood_calc = order.get("budwood_calculation", {})
        required = budwood_calc.get("total_required", 0)

        if variety not in variety_totals:
            variety_totals[variety] = 0
        variety_totals[variety] += required

    # Group by collection date (simplified - would use actual harvest windows)
    for variety, total in variety_totals.items():
        collection_schedule[variety] = {
            "total_required": total,
            "recommended_collection_date": "2024-01-15",  # Mock date
            "mother_trees_needed": math.ceil(total / 100),  # Assume 100 pieces per tree
            "storage_requirements": f"{total * 0.1}L cold storage"
        }

    return {
        "schedule": collection_schedule,
        "total_varieties": len(variety_totals),
        "total_budwood_needed": sum(variety_totals.values()),
        "collection_recommendations": [
            "Schedule collections 2-3 days before grafting",
            "Prioritize high-volume varieties",
            "Coordinate with weather conditions"
        ]
    }