from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
import time

from app.core.database import get_db
from app.models.supplier import Supplier, SupplierCatalog, PurchaseOrder, PurchaseOrderItem, SupplierEvaluation
from app.schemas.supplier import (
    Supplier as SupplierSchema, SupplierCreate, SupplierUpdate, SupplierSummary,
    SupplierCatalog as SupplierCatalogSchema, SupplierCatalogCreate, SupplierCatalogUpdate,
    PurchaseOrder as PurchaseOrderSchema, PurchaseOrderCreate, PurchaseOrderUpdate,
    SupplierEvaluation as SupplierEvaluationSchema, SupplierEvaluationCreate
)

router = APIRouter()


# Supplier Management Endpoints
@router.get("/", response_model=List[SupplierSchema])
async def get_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search by company name, contact person, or specializations"),
    supplier_type: Optional[str] = Query(None, description="Filter by supplier type"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    is_preferred: Optional[bool] = Query(None, description="Filter by preferred status"),
    db: AsyncSession = Depends(get_db)
):
    """Get all suppliers with optional filtering and search"""
    query = select(Supplier)

    if is_active is not None:
        query = query.where(Supplier.is_active == is_active)

    if is_preferred is not None:
        query = query.where(Supplier.is_preferred == is_preferred)

    if supplier_type:
        query = query.where(Supplier.supplier_type == supplier_type)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Supplier.company_name.ilike(search_term),
                Supplier.contact_person.ilike(search_term),
                Supplier.specializations.ilike(search_term)
            )
        )

    query = query.order_by(
        desc(Supplier.is_preferred), desc(Supplier.quality_rating), Supplier.company_name
    ).offset(skip).limit(limit)

    result = await db.execute(query)
    suppliers = result.scalars().all()
    return suppliers


@router.get("/summary", response_model=List[SupplierSummary])
async def get_suppliers_summary(
    search: Optional[str] = Query(None, description="Search by company name"),
    supplier_type: Optional[str] = Query(None, description="Filter by supplier type"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get supplier summary for dropdowns and autocomplete"""
    query = select(Supplier).where(Supplier.is_active == True)

    if supplier_type:
        query = query.where(Supplier.supplier_type == supplier_type)

    if search:
        search_term = f"%{search}%"
        query = query.where(Supplier.company_name.ilike(search_term))

    query = query.order_by(desc(Supplier.is_preferred), Supplier.company_name).limit(limit)

    result = await db.execute(query)
    suppliers = result.scalars().all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierSchema)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific supplier by ID"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/", response_model=SupplierSchema)
async def create_supplier(supplier_data: SupplierCreate, db: AsyncSession = Depends(get_db)):
    """Create a new supplier"""
    result = await db.execute(
        select(Supplier).where(Supplier.company_name == supplier_data.company_name)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this company name already exists")

    supplier = Supplier(**supplier_data.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
async def update_supplier(supplier_id: int, supplier_data: SupplierUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing supplier"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)

    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Soft delete a supplier (set is_active to false)"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    supplier.is_active = False
    await db.commit()
    return {"message": "Supplier deactivated successfully"}


# Supplier Catalog Endpoints
@router.get("/{supplier_id}/catalog", response_model=List[SupplierCatalogSchema])
async def get_supplier_catalog(
    supplier_id: int,
    product_type: Optional[str] = Query(None, description="Filter by product type"),
    species: Optional[str] = Query(None, description="Filter by species"),
    in_stock_only: bool = Query(False, description="Show only items in stock"),
    db: AsyncSession = Depends(get_db)
):
    """Get catalog items for a specific supplier"""
    query = select(SupplierCatalog).where(
        SupplierCatalog.supplier_id == supplier_id,
        SupplierCatalog.is_active == True
    )

    if product_type:
        query = query.where(SupplierCatalog.product_type == product_type)

    if species:
        query = query.where(SupplierCatalog.species.ilike(f"%{species}%"))

    if in_stock_only:
        query = query.where(SupplierCatalog.current_stock > 0)

    query = query.order_by(SupplierCatalog.product_type, SupplierCatalog.variety)

    result = await db.execute(query)
    catalog_items = result.scalars().all()
    return catalog_items


@router.post("/{supplier_id}/catalog", response_model=SupplierCatalogSchema)
async def create_catalog_item(supplier_id: int, catalog_data: SupplierCatalogCreate, db: AsyncSession = Depends(get_db)):
    """Add a new item to supplier catalog"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    catalog_dict = catalog_data.model_dump()
    catalog_dict["supplier_id"] = supplier_id
    catalog_item = SupplierCatalog(**catalog_dict)
    db.add(catalog_item)
    await db.commit()
    await db.refresh(catalog_item)
    return catalog_item


@router.put("/catalog/{catalog_id}", response_model=SupplierCatalogSchema)
async def update_catalog_item(catalog_id: int, catalog_data: SupplierCatalogUpdate, db: AsyncSession = Depends(get_db)):
    """Update a catalog item"""
    result = await db.execute(select(SupplierCatalog).where(SupplierCatalog.id == catalog_id))
    catalog_item = result.scalar_one_or_none()
    if not catalog_item:
        raise HTTPException(status_code=404, detail="Catalog item not found")

    update_data = catalog_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(catalog_item, field, value)

    await db.commit()
    await db.refresh(catalog_item)
    return catalog_item


# Purchase Order Endpoints
@router.get("/purchase-orders/", response_model=List[PurchaseOrderSchema])
async def get_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db)
):
    """Get all purchase orders with optional filtering"""
    query = select(PurchaseOrder).options(selectinload(PurchaseOrder.line_items))

    if supplier_id:
        query = query.where(PurchaseOrder.supplier_id == supplier_id)

    if status:
        query = query.where(PurchaseOrder.status == status)

    query = query.order_by(desc(PurchaseOrder.order_date)).offset(skip).limit(limit)

    result = await db.execute(query)
    purchase_orders = result.scalars().all()
    return purchase_orders


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderSchema)
async def get_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific purchase order by ID"""
    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.id == po_id)
        .options(selectinload(PurchaseOrder.line_items))
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.post("/purchase-orders/", response_model=PurchaseOrderSchema)
async def create_purchase_order(po_data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    """Create a new purchase order"""
    po_number = f"PO-{int(time.time())}"

    subtotal = sum(item.line_total for item in po_data.line_items)
    tax_amount = subtotal * 0.0875
    total_amount = subtotal + tax_amount

    po_dict = po_data.model_dump(exclude={'line_items'})
    po = PurchaseOrder(
        po_number=po_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        **po_dict
    )
    db.add(po)
    await db.flush()

    for item_data in po_data.line_items:
        item = PurchaseOrderItem(purchase_order_id=po.id, **item_data.model_dump())
        db.add(item)

    await db.commit()
    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.id == po.id)
        .options(selectinload(PurchaseOrder.line_items))
    )
    po = result.scalar_one()
    return po


@router.put("/purchase-orders/{po_id}", response_model=PurchaseOrderSchema)
async def update_purchase_order(po_id: int, po_data: PurchaseOrderUpdate, db: AsyncSession = Depends(get_db)):
    """Update a purchase order"""
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    update_data = po_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(po, field, value)

    await db.commit()
    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.id == po_id)
        .options(selectinload(PurchaseOrder.line_items))
    )
    po = result.scalar_one()
    return po


# Supplier Evaluation Endpoints
@router.get("/{supplier_id}/evaluations", response_model=List[SupplierEvaluationSchema])
async def get_supplier_evaluations(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Get all evaluations for a supplier"""
    result = await db.execute(
        select(SupplierEvaluation)
        .where(SupplierEvaluation.supplier_id == supplier_id)
        .order_by(desc(SupplierEvaluation.evaluation_date))
    )
    evaluations = result.scalars().all()
    return evaluations


@router.post("/evaluations/", response_model=SupplierEvaluationSchema)
async def create_supplier_evaluation(evaluation_data: SupplierEvaluationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new supplier evaluation"""
    evaluation = SupplierEvaluation(**evaluation_data.model_dump())
    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)

    # Update supplier ratings
    result = await db.execute(
        select(Supplier).where(Supplier.id == evaluation_data.supplier_id)
    )
    supplier = result.scalar_one_or_none()
    if supplier:
        eval_result = await db.execute(
            select(SupplierEvaluation)
            .where(SupplierEvaluation.supplier_id == evaluation_data.supplier_id)
        )
        evaluations = eval_result.scalars().all()

        if evaluations:
            supplier.quality_rating = sum(e.quality_score for e in evaluations) / len(evaluations)
            supplier.delivery_rating = sum(e.delivery_score for e in evaluations) / len(evaluations)
            supplier.price_rating = sum(e.price_score for e in evaluations) / len(evaluations)
            await db.commit()

    return evaluation


# Search across all catalogs
@router.get("/catalog/search", response_model=List[SupplierCatalogSchema])
async def search_catalog(
    search: str = Query(..., description="Search term for variety, species, or product type"),
    product_type: Optional[str] = Query(None, description="Filter by product type"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    in_stock_only: bool = Query(False, description="Show only items in stock"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Search across all supplier catalogs"""
    query = select(SupplierCatalog).where(SupplierCatalog.is_active == True)

    query = query.join(Supplier).where(Supplier.is_active == True)

    search_term = f"%{search}%"
    query = query.where(
        or_(
            SupplierCatalog.variety.ilike(search_term),
            SupplierCatalog.species.ilike(search_term),
            SupplierCatalog.product_type.ilike(search_term)
        )
    )

    if product_type:
        query = query.where(SupplierCatalog.product_type == product_type)

    if max_price:
        query = query.where(SupplierCatalog.unit_price <= max_price)

    if in_stock_only:
        query = query.where(SupplierCatalog.current_stock > 0)

    query = query.order_by(SupplierCatalog.unit_price).limit(limit)

    result = await db.execute(query)
    catalog_items = result.scalars().all()
    return catalog_items
