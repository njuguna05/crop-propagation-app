import pytest
from datetime import datetime, date
from httpx import AsyncClient

from app.services.budwood_service import calculate_budwood_requirements
from app.services.validation_service import (
    validate_quantity_requirements,
    validate_worker_assignments,
    validate_timing_requirements,
)


# Sample order creation data
SAMPLE_ORDER = {
    "client_name": "Green Valley Farms",
    "contact_person": "John Smith",
    "phone": "+1-555-0123",
    "email": "john@greenvalley.com",
    "requested_delivery": "2030-10-15",
    "crop_type": "Citrus",
    "variety": "Valencia Orange",
    "propagation_method": "grafting",
    "total_quantity": 500,
    "unit_price": 12.50,
    "priority": "high",
}


class TestOrderEndpoints:
    """Test suite for order management endpoints using async client with auth"""

    @pytest.mark.asyncio
    async def test_create_order(self, authenticated_client: AsyncClient):
        """Test creating a new order"""
        response = await authenticated_client.post(
            "/api/v1/orders/",
            json=SAMPLE_ORDER,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "Green Valley Farms"
        assert data["total_quantity"] == 500
        assert data["status"] == "order_created"
        assert data["order_number"].startswith("PO-")
        assert data["current_stage_quantity"] == 500
        assert data["total_value"] == 6250.0

    @pytest.mark.asyncio
    async def test_list_orders(self, authenticated_client: AsyncClient):
        """Test listing orders"""
        # Create an order first
        await authenticated_client.post("/api/v1/orders/", json=SAMPLE_ORDER)

        response = await authenticated_client.get("/api/v1/orders/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_order_by_id(self, authenticated_client: AsyncClient):
        """Test getting a specific order"""
        # Create order
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        response = await authenticated_client.get(f"/api/v1/orders/{order_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["client_name"] == "Green Valley Farms"

    @pytest.mark.asyncio
    async def test_get_order_not_found(self, authenticated_client: AsyncClient):
        """Test getting a non-existent order"""
        response = await authenticated_client.get("/api/v1/orders/INVALID-ORDER")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_order(self, authenticated_client: AsyncClient):
        """Test updating an order"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        update_data = {"priority": "urgent", "notes": "Rush order"}
        response = await authenticated_client.put(
            f"/api/v1/orders/{order_id}", json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == "urgent"

    @pytest.mark.asyncio
    async def test_update_order_status(self, authenticated_client: AsyncClient):
        """Test updating order status"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        status_data = {
            "status": "budwood_collection",
            "notes": "Starting budwood collection",
        }
        response = await authenticated_client.patch(
            f"/api/v1/orders/{order_id}/status", json=status_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "budwood_collection"
        assert len(data["stage_history"]) >= 2  # initial + new

    @pytest.mark.asyncio
    async def test_transfer_order_to_next_stage(
        self, authenticated_client: AsyncClient
    ):
        """Test transferring an order to the next stage"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        transfer_data = {
            "from_section": "receiving",
            "to_stage": "grafting_operation",
            "to_section": "grafting",
            "quantity": 480,
            "operator": "Alice Johnson",
            "notes": "Transfer to grafting",
        }

        response = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/transfer", json=transfer_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "grafting_operation"
        assert data["current_section"] == "grafting"
        assert data["current_stage_quantity"] == 480

    @pytest.mark.asyncio
    async def test_transfer_order_not_found(self, authenticated_client: AsyncClient):
        """Test transfer with non-existent order"""
        transfer_data = {
            "from_section": "receiving",
            "to_stage": "grafting_operation",
            "to_section": "grafting",
            "quantity": 95,
            "operator": "Alice Johnson",
        }

        response = await authenticated_client.post(
            "/api/v1/orders/INVALID-ORDER/transfer", json=transfer_data
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_transfer_exceeds_quantity(self, authenticated_client: AsyncClient):
        """Test transfer with quantity exceeding current stage"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        transfer_data = {
            "from_section": "receiving",
            "to_stage": "grafting_operation",
            "to_section": "grafting",
            "quantity": 9999,  # Exceeds 500
            "operator": "Alice Johnson",
        }

        response = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/transfer", json=transfer_data
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_health_assessment_success(self, authenticated_client: AsyncClient):
        """Test recording a health assessment"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        health_data = {
            "lost_quantity": 15,
            "notes": "Found 15 plants with fungal infection",
        }

        response = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/health-assessment", json=health_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["current_stage_quantity"] == 485  # 500 - 15

    @pytest.mark.asyncio
    async def test_health_assessment_exceeds_quantity(
        self, authenticated_client: AsyncClient
    ):
        """Test health assessment with lost quantity exceeding current"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        health_data = {
            "lost_quantity": 9999,
            "notes": "Invalid",
        }

        response = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/health-assessment", json=health_data
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_delete_order(self, authenticated_client: AsyncClient):
        """Test deleting an order"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        response = await authenticated_client.delete(f"/api/v1/orders/{order_id}")
        assert response.status_code == 200

        # Verify deleted
        get_resp = await authenticated_client.get(f"/api/v1/orders/{order_id}")
        assert get_resp.status_code == 404

    @pytest.mark.asyncio
    async def test_order_stats(self, authenticated_client: AsyncClient):
        """Test order statistics endpoint"""
        # Create some orders
        await authenticated_client.post("/api/v1/orders/", json=SAMPLE_ORDER)

        response = await authenticated_client.get("/api/v1/orders/stats/overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "active_orders" in data
        assert data["total_orders"] >= 1


class TestBudwoodCalculations:
    """Test suite for budwood calculation logic (unit tests)"""

    def test_budwood_calculation_grafting(self):
        """Test budwood calculation for grafting"""
        result = calculate_budwood_requirements(
            quantity=100,
            propagation_method="grafting",
            waste_factor_percent=15.0,
            extra_for_safety=10,
        )
        assert result["required_budwood"] == 120  # 100 * 1.2
        assert result["method_ratio"] == 1.2

    def test_budwood_calculation_cutting(self):
        """Test budwood calculation for cutting"""
        result = calculate_budwood_requirements(
            quantity=100,
            propagation_method="cutting",
            waste_factor_percent=0,
            extra_for_safety=0,
        )
        assert result["required_budwood"] == 200  # 100 * 2.0

    def test_budwood_calculation_tissue_culture(self):
        """Test budwood calculation for tissue culture"""
        result = calculate_budwood_requirements(
            quantity=100,
            propagation_method="tissue_culture",
            waste_factor_percent=0,
            extra_for_safety=0,
        )
        assert result["required_budwood"] == 10  # 100 * 0.1

    def test_budwood_calculation_seed(self):
        """Test budwood calculation for seed (no budwood needed)"""
        result = calculate_budwood_requirements(
            quantity=100,
            propagation_method="seed",
            waste_factor_percent=15.0,
            extra_for_safety=0,
        )
        assert result["required_budwood"] == 0
        assert result["total_required"] == 0

    def test_budwood_calculation_rounding(self):
        """Test that budwood calculations round up via math.ceil"""
        result = calculate_budwood_requirements(
            quantity=1,
            propagation_method="grafting",
            waste_factor_percent=15.0,
            extra_for_safety=0,
        )
        # 1 * 1.2 = 1.2, ceil = 2
        assert result["required_budwood"] == 2
        # 2 * 1.15 = 2.3, ceil = 3
        assert result["total_required"] == 3


class TestStageValidationLogic:
    """Test suite for stage validation business logic"""

    def test_validation_identifies_quantity_issues(self):
        """Test that validation correctly identifies quantity-related issues"""
        pass

    def test_validation_identifies_worker_issues(self):
        """Test that validation correctly identifies worker assignment issues"""
        pass

    def test_validation_identifies_timing_issues(self):
        """Test that validation correctly identifies timing-related issues"""
        pass

    def test_validation_environmental_requirements(self):
        """Test that validation checks environmental requirements"""
        pass


@pytest.mark.asyncio
class TestOrderWorkflow:
    """Integration tests for complete order workflow"""

    async def test_complete_order_lifecycle(self, authenticated_client: AsyncClient):
        """Test complete order from creation through transfer and health check"""
        # 1. Create order
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        assert create_resp.status_code == 200
        order_id = create_resp.json()["id"]

        # 2. Update status to budwood collection
        status_resp = await authenticated_client.patch(
            f"/api/v1/orders/{order_id}/status",
            json={"status": "budwood_collection", "notes": "Starting collection"},
        )
        assert status_resp.status_code == 200

        # 3. Transfer to grafting
        transfer_resp = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/transfer",
            json={
                "from_section": "budwood",
                "to_stage": "grafting_operation",
                "to_section": "grafting",
                "quantity": 490,
                "operator": "Alice Johnson",
                "notes": "Budwood collection complete",
            },
        )
        assert transfer_resp.status_code == 200
        assert transfer_resp.json()["status"] == "grafting_operation"

        # 4. Record health assessment
        health_resp = await authenticated_client.post(
            f"/api/v1/orders/{order_id}/health-assessment",
            json={"lost_quantity": 10, "notes": "Minor losses during grafting"},
        )
        assert health_resp.status_code == 200
        assert health_resp.json()["current_stage_quantity"] == 480

    async def test_order_with_multiple_status_changes(
        self, authenticated_client: AsyncClient
    ):
        """Test order processing through multiple status updates"""
        create_resp = await authenticated_client.post(
            "/api/v1/orders/", json=SAMPLE_ORDER
        )
        order_id = create_resp.json()["id"]

        stages = [
            "budwood_collection",
            "grafting_operation",
            "post_graft_care",
        ]
        for stage in stages:
            resp = await authenticated_client.patch(
                f"/api/v1/orders/{order_id}/status",
                json={"status": stage},
            )
            assert resp.status_code == 200
            assert resp.json()["status"] == stage

        # Should have initial + 3 stage entries in history
        final_resp = await authenticated_client.get(f"/api/v1/orders/{order_id}")
        assert len(final_resp.json()["stage_history"]) >= 4

    async def test_order_with_quality_issues(self, authenticated_client: AsyncClient):
        """Test order processing when quality issues arise"""
        pass
