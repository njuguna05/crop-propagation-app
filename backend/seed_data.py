"""
Seed data script for Crop Propagation App.
Creates a demo user account and populates the database with realistic sample data.

Usage:
    cd backend
    python seed_data.py
"""

import asyncio
import os
import sys
from datetime import date, datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

from app.core.database import Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.crop import Crop
from app.models.task import Task
from app.models.order import Order, OrderStageHistory
from app.models.records import BudwoodCollection, GraftingRecord, TransferRecord
from app.models.customer import Customer
from app.models.supplier import Supplier, SupplierCatalog


async def seed_database():
    """Main seed function that populates all tables with demo data."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)

    print(f"Connecting to database...")
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if demo user already exists
        result = await session.execute(select(User).where(User.email == "demo@cropprop.com"))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("Demo user already exists. Cleaning existing demo data...")
            await cleanup_demo_data(session, existing_user.id)
            user = existing_user
            # Update password in case it changed
            user.hashed_password = get_password_hash("demo1234")
            session.add(user)
            await session.flush()
        else:
            print("Creating demo user...")
            user = User(
                email="demo@cropprop.com",
                username="demo",
                hashed_password=get_password_hash("demo1234"),
                full_name="Demo User",
                is_active=True,
                is_superuser=False,
            )
            session.add(user)
            await session.flush()

        user_id = user.id
        print(f"Demo user ID: {user_id}")

        # Seed all data
        today = date.today()

        print("Seeding customers...")
        await seed_customers(session)

        print("Seeding suppliers...")
        await seed_suppliers(session)

        print("Seeding crops...")
        await seed_crops(session, user_id, today)

        print("Seeding orders...")
        order_ids = await seed_orders(session, user_id, today)

        print("Seeding tasks...")
        await seed_tasks(session, user_id, today, order_ids)

        print("Seeding budwood records...")
        bw_ids = await seed_budwood_records(session, user_id, today, order_ids)

        print("Seeding grafting records...")
        await seed_grafting_records(session, user_id, today, order_ids, bw_ids)

        print("Seeding transfer records...")
        await seed_transfer_records(session, user_id, today, order_ids)

        await session.commit()
        print("\nSeed data inserted successfully!")
        print(f"\nDemo Account Credentials:")
        print(f"  Email:    demo@cropprop.com")
        print(f"  Password: demo1234")

    await engine.dispose()


async def cleanup_demo_data(session: AsyncSession, user_id: int):
    """Remove existing demo data for the user."""
    # Delete in reverse dependency order
    await session.execute(text(f"DELETE FROM transfer_records WHERE user_id = {user_id}"))
    await session.execute(text(f"DELETE FROM grafting_records WHERE user_id = {user_id}"))
    await session.execute(text(f"DELETE FROM budwood_collection WHERE user_id = {user_id}"))
    await session.execute(text(f"DELETE FROM order_stage_history WHERE order_id IN (SELECT id FROM orders WHERE user_id = {user_id})"))
    await session.execute(text(f"DELETE FROM tasks WHERE user_id = {user_id}"))
    await session.execute(text(f"DELETE FROM orders WHERE user_id = {user_id}"))
    await session.execute(text(f"DELETE FROM crops WHERE user_id = {user_id}"))
    await session.flush()


async def seed_customers(session: AsyncSession):
    """Seed customer records."""
    customers = [
        Customer(
            company_name="Green Valley Farms",
            contact_person="James Ochieng",
            email="james@greenvalley.co.ke",
            phone="+254 712 345 678",
            address="P.O. Box 1234, Nakuru",
            city="Nakuru",
            state="Rift Valley",
            zip_code="20100",
            country="Kenya",
            customer_type="wholesale",
            payment_terms="net_30",
            credit_limit=500000,
            notes="Large-scale citrus buyer. Orders quarterly.",
            is_active="true",
        ),
        Customer(
            company_name="Sunrise Nurseries Ltd",
            contact_person="Grace Wanjiku",
            email="grace@sunrisenurseries.co.ke",
            phone="+254 722 987 654",
            address="Kiambu Road, Off Banana Hill",
            city="Kiambu",
            state="Central",
            zip_code="00900",
            country="Kenya",
            customer_type="nursery",
            payment_terms="net_15",
            credit_limit=300000,
            notes="Specializes in ornamentals and fruit trees.",
            is_active="true",
        ),
        Customer(
            company_name="Highlands Agri-Enterprise",
            contact_person="Peter Mwangi",
            email="peter@highlands-agri.co.ke",
            phone="+254 733 456 789",
            address="Moi Avenue, Eldoret",
            city="Eldoret",
            state="Rift Valley",
            zip_code="30100",
            country="Kenya",
            customer_type="wholesale",
            payment_terms="net_30",
            credit_limit=750000,
            notes="Major avocado seedling distributor for Western Kenya.",
            is_active="true",
        ),
        Customer(
            company_name="Mama Mboga Garden Centre",
            contact_person="Florence Adhiambo",
            email="florence@mamamboga.co.ke",
            phone="+254 700 123 456",
            address="Ngong Road, Karen",
            city="Nairobi",
            state="Nairobi",
            zip_code="00100",
            country="Kenya",
            customer_type="retail",
            payment_terms="cash",
            credit_limit=50000,
            notes="Small retail garden centre. Walk-in customers.",
            is_active="true",
        ),
        Customer(
            company_name="Coast Tropical Farms",
            contact_person="Hassan Ali",
            email="hassan@coasttropical.co.ke",
            phone="+254 741 567 890",
            address="Nyali Road, Mombasa",
            city="Mombasa",
            state="Coast",
            zip_code="80100",
            country="Kenya",
            customer_type="wholesale",
            payment_terms="net_30",
            credit_limit=400000,
            notes="Tropical fruit specialist. Orders mango and citrus seedlings.",
            is_active="true",
        ),
        Customer(
            company_name="Rift Valley Orchards",
            contact_person="Daniel Kiprop",
            email="daniel@rvorchards.co.ke",
            phone="+254 759 876 543",
            address="Naivasha Highway",
            city="Naivasha",
            state="Rift Valley",
            zip_code="20117",
            country="Kenya",
            customer_type="nursery",
            payment_terms="net_15",
            credit_limit=250000,
            notes="Partner nursery. Shares rootstock varieties.",
            is_active="true",
        ),
    ]
    session.add_all(customers)
    await session.flush()


async def seed_suppliers(session: AsyncSession):
    """Seed supplier records."""
    suppliers = [
        Supplier(
            company_name="Kenya Forestry Research Institute",
            contact_person="Dr. Wangari Kamau",
            email="wangari@kefri.go.ke",
            phone="+254 720 111 222",
            address="Muguga, Off Nairobi-Nakuru Highway",
            city="Kiambu",
            state="Central",
            zip_code="00902",
            country="Kenya",
            supplier_type="nursery",
            specializations='["Citrus", "Indigenous Trees", "Forestry"]',
            certifications='["Government Certified", "Disease-free"]',
            quality_rating=4.8,
            delivery_rating=4.5,
            price_rating=4.2,
            payment_terms="net_30",
            minimum_order_value=10000.0,
            lead_time_days=14,
            shipping_cost=5000.0,
            is_active=True,
            is_preferred=True,
            total_orders=12,
            total_spent=450000.0,
        ),
        Supplier(
            company_name="Jomo Kenyatta University Agri-Hub",
            contact_person="Prof. Njoroge Maina",
            email="njoroge@jkuat-agrihub.ac.ke",
            phone="+254 731 333 444",
            address="JKUAT Main Campus, Juja",
            city="Juja",
            state="Central",
            zip_code="00600",
            country="Kenya",
            supplier_type="nursery",
            specializations='["Avocado", "Macadamia", "Tissue Culture"]',
            certifications='["Research Certified", "Virus Indexed"]',
            quality_rating=4.6,
            delivery_rating=4.0,
            price_rating=3.8,
            payment_terms="net_15",
            minimum_order_value=15000.0,
            lead_time_days=21,
            shipping_cost=3000.0,
            is_active=True,
            is_preferred=True,
            total_orders=8,
            total_spent=320000.0,
        ),
        Supplier(
            company_name="Athi River Rootstock Farms",
            contact_person="Samuel Mutua",
            email="samuel@athirootstock.co.ke",
            phone="+254 745 555 666",
            address="Athi River Industrial Area",
            city="Athi River",
            state="Machakos",
            zip_code="00204",
            country="Kenya",
            supplier_type="farm",
            specializations='["Rootstock", "Citrus", "Mango"]',
            certifications='["Disease-free", "Organic"]',
            quality_rating=4.3,
            delivery_rating=4.7,
            price_rating=4.5,
            payment_terms="net_30",
            minimum_order_value=5000.0,
            lead_time_days=7,
            shipping_cost=2000.0,
            is_active=True,
            is_preferred=False,
            total_orders=15,
            total_spent=280000.0,
        ),
        Supplier(
            company_name="Lake Region Budwood Collectors",
            contact_person="Mercy Akinyi",
            email="mercy@lakebudwood.co.ke",
            phone="+254 756 777 888",
            address="Kisumu-Busia Highway",
            city="Kisumu",
            state="Nyanza",
            zip_code="40100",
            country="Kenya",
            supplier_type="collector",
            specializations='["Budwood", "Citrus Scions", "Avocado Scions"]',
            certifications='["Field Certified"]',
            quality_rating=4.1,
            delivery_rating=3.9,
            price_rating=4.6,
            payment_terms="cash",
            minimum_order_value=3000.0,
            lead_time_days=5,
            shipping_cost=1500.0,
            is_active=True,
            is_preferred=False,
            total_orders=20,
            total_spent=180000.0,
        ),
    ]
    session.add_all(suppliers)
    await session.flush()


async def seed_crops(session: AsyncSession, user_id: int, today: date):
    """Seed crop records at various propagation stages."""
    crops = [
        Crop(
            user_id=user_id,
            name="Citrus",
            variety="Valencia Orange",
            propagation_method="grafting",
            current_stage="grafting",
            location="Greenhouse A",
            planted_date=today - timedelta(days=45),
            expected_germination=today - timedelta(days=30),
            temperature=26.5,
            humidity=78.0,
            watered=today - timedelta(days=1),
            notes="Healthy growth. Ready for grafting onto Rough Lemon rootstock.",
        ),
        Crop(
            user_id=user_id,
            name="Avocado",
            variety="Hass",
            propagation_method="grafting",
            current_stage="nursery_beds",
            location="Nursery Block B",
            planted_date=today - timedelta(days=120),
            expected_germination=today - timedelta(days=90),
            temperature=24.0,
            humidity=72.0,
            watered=today,
            notes="Mature grafts. Hardening off for dispatch.",
        ),
        Crop(
            user_id=user_id,
            name="Mango",
            variety="Tommy Atkins",
            propagation_method="grafting",
            current_stage="post_graft_care",
            location="Shade House 1",
            planted_date=today - timedelta(days=60),
            expected_germination=today - timedelta(days=45),
            temperature=28.0,
            humidity=82.0,
            watered=today - timedelta(days=1),
            notes="Graft union healing well. Monitoring for rejection.",
        ),
        Crop(
            user_id=user_id,
            name="Citrus",
            variety="Pixie Mandarin",
            propagation_method="grafting",
            current_stage="budwood_collection",
            location="Mother Block",
            planted_date=today - timedelta(days=15),
            temperature=25.0,
            humidity=70.0,
            watered=today - timedelta(days=2),
            notes="Budwood selection in progress from certified mother trees.",
        ),
        Crop(
            user_id=user_id,
            name="Macadamia",
            variety="KRG-15",
            propagation_method="grafting",
            current_stage="germinated",
            location="Propagation House",
            planted_date=today - timedelta(days=90),
            expected_germination=today - timedelta(days=60),
            temperature=23.0,
            humidity=75.0,
            watered=today,
            notes="Rootstock seedlings germinated. Growing to grafting size.",
        ),
        Crop(
            user_id=user_id,
            name="Avocado",
            variety="Fuerte",
            propagation_method="seed",
            current_stage="planted",
            location="Seed Beds",
            planted_date=today - timedelta(days=7),
            expected_germination=today + timedelta(days=21),
            temperature=25.5,
            humidity=80.0,
            watered=today,
            notes="Fresh seeds planted for rootstock production.",
        ),
        Crop(
            user_id=user_id,
            name="Citrus",
            variety="Washington Navel",
            propagation_method="grafting",
            current_stage="hardening",
            location="Open Nursery C",
            planted_date=today - timedelta(days=150),
            temperature=27.0,
            humidity=65.0,
            watered=today - timedelta(days=1),
            notes="Final hardening stage. Ready for dispatch within 2 weeks.",
        ),
        Crop(
            user_id=user_id,
            name="Passion Fruit",
            variety="Purple Passion",
            propagation_method="cutting",
            current_stage="rooting",
            location="Mist Chamber",
            planted_date=today - timedelta(days=20),
            temperature=26.0,
            humidity=90.0,
            watered=today,
            notes="Stem cuttings under mist. Root initials visible.",
        ),
    ]
    session.add_all(crops)
    await session.flush()


async def seed_orders(session: AsyncSession, user_id: int, today: date) -> list:
    """Seed propagation orders at various stages."""
    orders_data = [
        {
            "id": "PO-2026-001",
            "order_number": "PO-2026-001",
            "status": "grafting_operation",
            "current_section": "grafting",
            "client_name": "Green Valley Farms",
            "contact_person": "James Ochieng",
            "phone": "+254 712 345 678",
            "email": "james@greenvalley.co.ke",
            "order_date": today - timedelta(days=30),
            "requested_delivery": today + timedelta(days=60),
            "crop_type": "Citrus",
            "variety": "Valencia Orange",
            "total_quantity": 500,
            "completed_quantity": 0,
            "current_stage_quantity": 420,
            "propagation_method": "grafting",
            "unit_price": 150.0,
            "total_value": 75000.0,
            "priority": "high",
            "notes": [{"date": str(today - timedelta(days=30)), "text": "Order received. Starting budwood collection.", "author": "Demo User"}],
            "specifications": {"rootstock": "Rough Lemon", "min_height_cm": 30, "container": "1L poly bags"},
            "budwood_calculation": {"required_budwood": 600, "waste_factor_percent": 15, "extra_for_safety": 50, "total_required": 740},
            "worker_assignments": {"budwood_collector": "John Kamau", "grafter": "Alice Wanjiru", "nursery_manager": "Peter Omondi", "quality_controller": "Grace Nyambura"},
            "stage_history": [
                {"stage": "order_created", "date": str(today - timedelta(days=30)), "quantity": 500, "operator": "System"},
                {"stage": "budwood_collection", "date": str(today - timedelta(days=25)), "quantity": 500, "operator": "John Kamau", "notes": "Budwood collected from Block A mother trees"},
                {"stage": "grafting_setup", "date": str(today - timedelta(days=18)), "quantity": 480, "operator": "Alice Wanjiru", "notes": "Rootstock prepared and matched"},
                {"stage": "grafting_operation", "date": str(today - timedelta(days=12)), "quantity": 420, "operator": "Alice Wanjiru", "notes": "Grafting in progress. 420 of 480 completed"},
            ],
        },
        {
            "id": "PO-2026-002",
            "order_number": "PO-2026-002",
            "status": "nursery_beds",
            "current_section": "nursery",
            "client_name": "Highlands Agri-Enterprise",
            "contact_person": "Peter Mwangi",
            "phone": "+254 733 456 789",
            "email": "peter@highlands-agri.co.ke",
            "order_date": today - timedelta(days=90),
            "requested_delivery": today + timedelta(days=15),
            "crop_type": "Avocado",
            "variety": "Hass",
            "total_quantity": 1000,
            "completed_quantity": 0,
            "current_stage_quantity": 870,
            "propagation_method": "grafting",
            "unit_price": 250.0,
            "total_value": 250000.0,
            "priority": "high",
            "notes": [
                {"date": str(today - timedelta(days=90)), "text": "Large order for Hass avocado seedlings.", "author": "Demo User"},
                {"date": str(today - timedelta(days=45)), "text": "Grafting completed. 92% success rate.", "author": "Alice Wanjiru"},
            ],
            "specifications": {"rootstock": "Puebla", "min_height_cm": 40, "container": "2L poly bags", "certification": "disease-free"},
            "worker_assignments": {"budwood_collector": "John Kamau", "grafter": "Alice Wanjiru", "nursery_manager": "Peter Omondi", "quality_controller": "Grace Nyambura"},
            "stage_history": [
                {"stage": "order_created", "date": str(today - timedelta(days=90)), "quantity": 1000, "operator": "System"},
                {"stage": "budwood_collection", "date": str(today - timedelta(days=85)), "quantity": 1000, "operator": "John Kamau"},
                {"stage": "grafting_setup", "date": str(today - timedelta(days=75)), "quantity": 960, "operator": "Alice Wanjiru"},
                {"stage": "grafting_operation", "date": str(today - timedelta(days=65)), "quantity": 950, "operator": "Alice Wanjiru"},
                {"stage": "post_graft_care", "date": str(today - timedelta(days=50)), "quantity": 920, "operator": "Peter Omondi"},
                {"stage": "quality_check", "date": str(today - timedelta(days=35)), "quantity": 900, "operator": "Grace Nyambura"},
                {"stage": "hardening", "date": str(today - timedelta(days=20)), "quantity": 880, "operator": "Peter Omondi"},
            ],
        },
        {
            "id": "PO-2026-003",
            "order_number": "PO-2026-003",
            "status": "order_created",
            "current_section": None,
            "client_name": "Coast Tropical Farms",
            "contact_person": "Hassan Ali",
            "phone": "+254 741 567 890",
            "email": "hassan@coasttropical.co.ke",
            "order_date": today - timedelta(days=3),
            "requested_delivery": today + timedelta(days=120),
            "crop_type": "Mango",
            "variety": "Tommy Atkins",
            "total_quantity": 300,
            "completed_quantity": 0,
            "current_stage_quantity": 300,
            "propagation_method": "grafting",
            "unit_price": 200.0,
            "total_value": 60000.0,
            "priority": "medium",
            "notes": [{"date": str(today - timedelta(days=3)), "text": "New order for Tommy Atkins mango seedlings.", "author": "Demo User"}],
            "specifications": {"rootstock": "Local Mango", "min_height_cm": 35, "container": "2L poly bags"},
            "stage_history": [
                {"stage": "order_created", "date": str(today - timedelta(days=3)), "quantity": 300, "operator": "System"},
            ],
        },
        {
            "id": "PO-2026-004",
            "order_number": "PO-2026-004",
            "status": "dispatched",
            "current_section": "dispatch",
            "client_name": "Sunrise Nurseries Ltd",
            "contact_person": "Grace Wanjiku",
            "phone": "+254 722 987 654",
            "email": "grace@sunrisenurseries.co.ke",
            "order_date": today - timedelta(days=150),
            "requested_delivery": today - timedelta(days=10),
            "crop_type": "Citrus",
            "variety": "Pixie Mandarin",
            "total_quantity": 750,
            "completed_quantity": 720,
            "current_stage_quantity": 0,
            "propagation_method": "grafting",
            "unit_price": 180.0,
            "total_value": 135000.0,
            "priority": "medium",
            "notes": [
                {"date": str(today - timedelta(days=150)), "text": "Order for Pixie Mandarin.", "author": "Demo User"},
                {"date": str(today - timedelta(days=10)), "text": "Dispatched. 720 of 750 survived. 96% survival rate.", "author": "Peter Omondi"},
            ],
            "specifications": {"rootstock": "Rough Lemon", "min_height_cm": 30, "container": "1L poly bags"},
            "worker_assignments": {"budwood_collector": "John Kamau", "grafter": "Samuel Otieno", "nursery_manager": "Peter Omondi", "quality_controller": "Grace Nyambura"},
            "stage_history": [
                {"stage": "order_created", "date": str(today - timedelta(days=150)), "quantity": 750, "operator": "System"},
                {"stage": "budwood_collection", "date": str(today - timedelta(days=145)), "quantity": 750, "operator": "John Kamau"},
                {"stage": "grafting_setup", "date": str(today - timedelta(days=135)), "quantity": 740, "operator": "Samuel Otieno"},
                {"stage": "grafting_operation", "date": str(today - timedelta(days=120)), "quantity": 735, "operator": "Samuel Otieno"},
                {"stage": "post_graft_care", "date": str(today - timedelta(days=100)), "quantity": 730, "operator": "Peter Omondi"},
                {"stage": "quality_check", "date": str(today - timedelta(days=70)), "quantity": 725, "operator": "Grace Nyambura"},
                {"stage": "hardening", "date": str(today - timedelta(days=40)), "quantity": 722, "operator": "Peter Omondi"},
                {"stage": "pre_dispatch", "date": str(today - timedelta(days=15)), "quantity": 720, "operator": "Grace Nyambura"},
                {"stage": "dispatched", "date": str(today - timedelta(days=10)), "quantity": 720, "operator": "Peter Omondi"},
            ],
        },
        {
            "id": "PO-2026-005",
            "order_number": "PO-2026-005",
            "status": "post_graft_care",
            "current_section": "shade_house",
            "client_name": "Mama Mboga Garden Centre",
            "contact_person": "Florence Adhiambo",
            "phone": "+254 700 123 456",
            "email": "florence@mamamboga.co.ke",
            "order_date": today - timedelta(days=50),
            "requested_delivery": today + timedelta(days=40),
            "crop_type": "Citrus",
            "variety": "Washington Navel",
            "total_quantity": 200,
            "completed_quantity": 0,
            "current_stage_quantity": 185,
            "propagation_method": "grafting",
            "unit_price": 160.0,
            "total_value": 32000.0,
            "priority": "low",
            "notes": [{"date": str(today - timedelta(days=50)), "text": "Small order for retail garden centre.", "author": "Demo User"}],
            "specifications": {"rootstock": "Rough Lemon", "min_height_cm": 25, "container": "1L poly bags"},
            "stage_history": [
                {"stage": "order_created", "date": str(today - timedelta(days=50)), "quantity": 200, "operator": "System"},
                {"stage": "budwood_collection", "date": str(today - timedelta(days=45)), "quantity": 200, "operator": "John Kamau"},
                {"stage": "grafting_setup", "date": str(today - timedelta(days=38)), "quantity": 195, "operator": "Alice Wanjiru"},
                {"stage": "grafting_operation", "date": str(today - timedelta(days=30)), "quantity": 190, "operator": "Alice Wanjiru"},
                {"stage": "post_graft_care", "date": str(today - timedelta(days=20)), "quantity": 185, "operator": "Peter Omondi"},
            ],
        },
    ]

    order_ids = []
    for od in orders_data:
        order = Order(
            id=od["id"],
            user_id=user_id,
            order_number=od["order_number"],
            status=od["status"],
            current_section=od["current_section"],
            client_name=od["client_name"],
            contact_person=od["contact_person"],
            phone=od["phone"],
            email=od["email"],
            order_date=od["order_date"],
            requested_delivery=od["requested_delivery"],
            crop_type=od["crop_type"],
            variety=od["variety"],
            total_quantity=od["total_quantity"],
            completed_quantity=od["completed_quantity"],
            current_stage_quantity=od["current_stage_quantity"],
            propagation_method=od["propagation_method"],
            unit_price=od["unit_price"],
            total_value=od["total_value"],
            priority=od["priority"],
            notes=od["notes"],
            specifications=od.get("specifications"),
            budwood_calculation=od.get("budwood_calculation"),
            worker_assignments=od.get("worker_assignments"),
            stage_history=od["stage_history"],
        )
        session.add(order)
        order_ids.append(od["id"])

        # Add stage history records
        for sh in od["stage_history"]:
            history = OrderStageHistory(
                order_id=od["id"],
                stage=sh["stage"],
                date=date.fromisoformat(sh["date"]),
                quantity=sh["quantity"],
                operator=sh.get("operator"),
                notes=sh.get("notes"),
            )
            session.add(history)

    await session.flush()
    return order_ids


async def seed_tasks(session: AsyncSession, user_id: int, today: date, order_ids: list):
    """Seed task records - mix of completed and pending."""
    tasks = [
        # Completed tasks
        Task(
            user_id=user_id,
            order_id="PO-2026-001",
            task="Collect Valencia Orange budwood from Block A",
            due_date=today - timedelta(days=25),
            completed=True,
            priority="high",
            notes="Collected 740 budwood pieces. Quality: Grade A.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-001",
            task="Prepare Rough Lemon rootstock for grafting",
            due_date=today - timedelta(days=20),
            completed=True,
            priority="high",
            notes="480 rootstock seedlings selected and prepared.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-002",
            task="Complete Hass avocado grafting batch 2",
            due_date=today - timedelta(days=60),
            completed=True,
            priority="high",
            notes="Batch 2 grafting complete. 450 grafts, 92% success.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-004",
            task="Final quality inspection for Pixie Mandarin dispatch",
            due_date=today - timedelta(days=12),
            completed=True,
            priority="urgent",
            notes="Passed. 720 seedlings approved for dispatch.",
        ),
        Task(
            user_id=user_id,
            task="Calibrate greenhouse temperature sensors",
            due_date=today - timedelta(days=5),
            completed=True,
            priority="medium",
            notes="All sensors recalibrated. Max deviation: 0.3°C.",
        ),

        # Pending / upcoming tasks
        Task(
            user_id=user_id,
            order_id="PO-2026-001",
            task="Complete Valencia Orange grafting - remaining 60 units",
            due_date=today + timedelta(days=2),
            completed=False,
            priority="high",
            notes="60 grafts remaining from batch.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-002",
            task="Prepare Hass avocado seedlings for dispatch",
            due_date=today + timedelta(days=10),
            completed=False,
            priority="urgent",
            notes="870 seedlings to be graded and packed for shipping.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-003",
            task="Source Tommy Atkins mango budwood",
            due_date=today + timedelta(days=5),
            completed=False,
            priority="medium",
            notes="Contact Lake Region Budwood Collectors for scion supply.",
        ),
        Task(
            user_id=user_id,
            order_id="PO-2026-005",
            task="Monitor Washington Navel graft union healing",
            due_date=today + timedelta(days=3),
            completed=False,
            priority="medium",
            notes="Check for callus formation and remove grafting tape if healed.",
        ),
        Task(
            user_id=user_id,
            task="Water all seedlings in Greenhouse A",
            due_date=today,
            completed=False,
            priority="high",
            notes="Morning watering schedule. Check soil moisture first.",
        ),
        Task(
            user_id=user_id,
            task="Apply foliar fertilizer to nursery beds",
            due_date=today + timedelta(days=1),
            completed=False,
            priority="medium",
            notes="Use 20-20-20 NPK foliar at 5g/L.",
        ),
        Task(
            user_id=user_id,
            task="Scout for pest and disease in shade houses",
            due_date=today + timedelta(days=2),
            completed=False,
            priority="high",
            notes="Focus on aphids and citrus leaf miner.",
        ),
        Task(
            user_id=user_id,
            task="Update stock inventory for monthly report",
            due_date=today + timedelta(days=7),
            completed=False,
            priority="low",
            notes="Count all seedlings by variety and stage.",
        ),
        # Overdue task
        Task(
            user_id=user_id,
            task="Order new poly bags (1L and 2L) from supplier",
            due_date=today - timedelta(days=2),
            completed=False,
            priority="medium",
            notes="Running low on poly bags. Check with Athi River supplier.",
        ),
    ]
    session.add_all(tasks)
    await session.flush()


async def seed_budwood_records(session: AsyncSession, user_id: int, today: date, order_ids: list) -> list:
    """Seed budwood collection records."""
    ts = int(datetime.now().timestamp())
    records = [
        BudwoodCollection(
            id=f"BW-{ts}-001",
            user_id=user_id,
            order_id="PO-2026-001",
            mother_tree_id="MT-VAL-001",
            variety="Valencia Orange",
            harvest_date=today - timedelta(days=25),
            quantity=400,
            quality_score=8.5,
            operator="John Kamau",
            storage_location="Cold Room A",
            storage_temperature=4.0,
            storage_humidity=85.0,
            notes="First batch. Excellent quality from Block A mother trees.",
        ),
        BudwoodCollection(
            id=f"BW-{ts}-002",
            user_id=user_id,
            order_id="PO-2026-001",
            mother_tree_id="MT-VAL-002",
            variety="Valencia Orange",
            harvest_date=today - timedelta(days=23),
            quantity=340,
            quality_score=8.0,
            operator="John Kamau",
            storage_location="Cold Room A",
            storage_temperature=4.0,
            storage_humidity=85.0,
            notes="Second batch to meet order requirement.",
        ),
        BudwoodCollection(
            id=f"BW-{ts}-003",
            user_id=user_id,
            order_id="PO-2026-002",
            mother_tree_id="MT-HAS-001",
            variety="Hass Avocado",
            harvest_date=today - timedelta(days=85),
            quantity=600,
            quality_score=9.0,
            operator="John Kamau",
            storage_location="Cold Room B",
            storage_temperature=5.0,
            storage_humidity=80.0,
            notes="Premium quality Hass scion wood.",
        ),
        BudwoodCollection(
            id=f"BW-{ts}-004",
            user_id=user_id,
            order_id="PO-2026-002",
            mother_tree_id="MT-HAS-002",
            variety="Hass Avocado",
            harvest_date=today - timedelta(days=83),
            quantity=550,
            quality_score=8.7,
            operator="John Kamau",
            storage_location="Cold Room B",
            storage_temperature=5.0,
            storage_humidity=80.0,
            notes="Second collection for large Hass order.",
        ),
        BudwoodCollection(
            id=f"BW-{ts}-005",
            user_id=user_id,
            order_id="PO-2026-004",
            mother_tree_id="MT-PIX-001",
            variety="Pixie Mandarin",
            harvest_date=today - timedelta(days=145),
            quantity=900,
            quality_score=8.8,
            operator="John Kamau",
            storage_location="Cold Room A",
            storage_temperature=4.0,
            storage_humidity=85.0,
            notes="High quality Pixie budwood for Sunrise Nurseries order.",
        ),
        BudwoodCollection(
            id=f"BW-{ts}-006",
            user_id=user_id,
            order_id="PO-2026-005",
            mother_tree_id="MT-NAV-001",
            variety="Washington Navel",
            harvest_date=today - timedelta(days=45),
            quantity=250,
            quality_score=7.8,
            operator="John Kamau",
            storage_location="Cold Room A",
            storage_temperature=4.0,
            storage_humidity=85.0,
            notes="Navel orange budwood for small order.",
        ),
    ]
    session.add_all(records)
    await session.flush()
    return [r.id for r in records]


async def seed_grafting_records(session: AsyncSession, user_id: int, today: date, order_ids: list, bw_ids: list):
    """Seed grafting operation records."""
    ts = int(datetime.now().timestamp())
    records = [
        GraftingRecord(
            id=f"GR-{ts}-001",
            user_id=user_id,
            order_id="PO-2026-001",
            budwood_collection_id=bw_ids[0],
            date=today - timedelta(days=12),
            operator="Alice Wanjiru",
            technique="whip_and_tongue",
            rootstock_type="Rough Lemon",
            scion_variety="Valencia Orange",
            quantity=250,
            success_count=225,
            success_rate=90.0,
            temperature=24.0,
            humidity=80.0,
            notes="Morning session. Excellent conditions.",
        ),
        GraftingRecord(
            id=f"GR-{ts}-002",
            user_id=user_id,
            order_id="PO-2026-001",
            budwood_collection_id=bw_ids[1],
            date=today - timedelta(days=10),
            operator="Alice Wanjiru",
            technique="whip_and_tongue",
            rootstock_type="Rough Lemon",
            scion_variety="Valencia Orange",
            quantity=230,
            success_count=195,
            success_rate=84.8,
            temperature=25.0,
            humidity=78.0,
            notes="Afternoon session. Slightly lower success due to heat.",
        ),
        GraftingRecord(
            id=f"GR-{ts}-003",
            user_id=user_id,
            order_id="PO-2026-002",
            budwood_collection_id=bw_ids[2],
            date=today - timedelta(days=65),
            operator="Alice Wanjiru",
            technique="cleft",
            rootstock_type="Puebla",
            scion_variety="Hass Avocado",
            quantity=500,
            success_count=465,
            success_rate=93.0,
            temperature=23.0,
            humidity=82.0,
            notes="Large batch. Cleft grafting on Puebla rootstock.",
        ),
        GraftingRecord(
            id=f"GR-{ts}-004",
            user_id=user_id,
            order_id="PO-2026-002",
            budwood_collection_id=bw_ids[3],
            date=today - timedelta(days=62),
            operator="Alice Wanjiru",
            technique="cleft",
            rootstock_type="Puebla",
            scion_variety="Hass Avocado",
            quantity=460,
            success_count=420,
            success_rate=91.3,
            temperature=24.0,
            humidity=80.0,
            notes="Second batch for Hass order.",
        ),
        GraftingRecord(
            id=f"GR-{ts}-005",
            user_id=user_id,
            order_id="PO-2026-004",
            budwood_collection_id=bw_ids[4],
            date=today - timedelta(days=120),
            operator="Samuel Otieno",
            technique="t_budding",
            rootstock_type="Rough Lemon",
            scion_variety="Pixie Mandarin",
            quantity=750,
            success_count=735,
            success_rate=98.0,
            temperature=25.0,
            humidity=85.0,
            notes="Outstanding success rate. T-budding technique.",
        ),
        GraftingRecord(
            id=f"GR-{ts}-006",
            user_id=user_id,
            order_id="PO-2026-005",
            budwood_collection_id=bw_ids[5],
            date=today - timedelta(days=30),
            operator="Alice Wanjiru",
            technique="whip_and_tongue",
            rootstock_type="Rough Lemon",
            scion_variety="Washington Navel",
            quantity=200,
            success_count=190,
            success_rate=95.0,
            temperature=24.5,
            humidity=79.0,
            notes="Small batch. Good conditions.",
        ),
    ]
    session.add_all(records)
    await session.flush()


async def seed_transfer_records(session: AsyncSession, user_id: int, today: date, order_ids: list):
    """Seed transfer records between stages."""
    ts = int(datetime.now().timestamp())
    records = [
        # PO-2026-001 transfers
        TransferRecord(
            id=f"TR-{ts}-001",
            user_id=user_id,
            order_id="PO-2026-001",
            from_section="budwood",
            to_section="grafting",
            from_stage="budwood_collection",
            to_stage="grafting_setup",
            quantity=480,
            transfer_date=today - timedelta(days=18),
            operator="Alice Wanjiru",
            quality_score=8.5,
            survival_rate=96.0,
            notes="Budwood transferred to grafting area. 20 pieces discarded.",
        ),
        TransferRecord(
            id=f"TR-{ts}-002",
            user_id=user_id,
            order_id="PO-2026-001",
            from_section="grafting",
            to_section="grafting",
            from_stage="grafting_setup",
            to_stage="grafting_operation",
            quantity=420,
            transfer_date=today - timedelta(days=12),
            operator="Alice Wanjiru",
            quality_score=8.0,
            survival_rate=87.5,
            notes="Grafting commenced. 420 grafts completed out of 480 prepared.",
        ),

        # PO-2026-002 transfers (more complete order)
        TransferRecord(
            id=f"TR-{ts}-003",
            user_id=user_id,
            order_id="PO-2026-002",
            from_section="budwood",
            to_section="grafting",
            from_stage="budwood_collection",
            to_stage="grafting_setup",
            quantity=960,
            transfer_date=today - timedelta(days=75),
            operator="Alice Wanjiru",
            quality_score=9.0,
            survival_rate=96.0,
            notes="Avocado scions transferred. Premium quality.",
        ),
        TransferRecord(
            id=f"TR-{ts}-004",
            user_id=user_id,
            order_id="PO-2026-002",
            from_section="grafting",
            to_section="shade_house",
            from_stage="grafting_operation",
            to_stage="post_graft_care",
            quantity=920,
            transfer_date=today - timedelta(days=50),
            operator="Peter Omondi",
            quality_score=8.5,
            survival_rate=92.0,
            notes="Grafted avocados moved to shade house for healing.",
        ),
        TransferRecord(
            id=f"TR-{ts}-005",
            user_id=user_id,
            order_id="PO-2026-002",
            from_section="shade_house",
            to_section="nursery",
            from_stage="quality_check",
            to_stage="hardening",
            quantity=880,
            transfer_date=today - timedelta(days=20),
            operator="Peter Omondi",
            quality_score=9.0,
            survival_rate=97.8,
            notes="Quality check passed. Moved to open nursery for hardening.",
        ),

        # PO-2026-004 transfers (completed order)
        TransferRecord(
            id=f"TR-{ts}-006",
            user_id=user_id,
            order_id="PO-2026-004",
            from_section="nursery",
            to_section="dispatch",
            from_stage="pre_dispatch",
            to_stage="dispatched",
            quantity=720,
            transfer_date=today - timedelta(days=10),
            operator="Peter Omondi",
            quality_score=9.2,
            survival_rate=96.0,
            notes="Final dispatch of 720 Pixie Mandarin seedlings. Excellent condition.",
        ),

        # PO-2026-005 transfers
        TransferRecord(
            id=f"TR-{ts}-007",
            user_id=user_id,
            order_id="PO-2026-005",
            from_section="grafting",
            to_section="shade_house",
            from_stage="grafting_operation",
            to_stage="post_graft_care",
            quantity=185,
            transfer_date=today - timedelta(days=20),
            operator="Peter Omondi",
            quality_score=8.0,
            survival_rate=95.0,
            notes="Washington Navel grafts moved for post-graft care.",
        ),
    ]
    session.add_all(records)
    await session.flush()


if __name__ == "__main__":
    print("=" * 60)
    print("  Crop Propagation App - Database Seeder")
    print("=" * 60)
    asyncio.run(seed_database())
