"""Upgrade existing database to multi-tenancy from 0fa7bf3fafaf

Revision ID: bridge_multitenancy
Revises: 0fa7bf3fafaf
Create Date: 2026-02-10 00:00:00.000000

This migration bridges the gap between the old single-tenant schema
and the new multi-tenant schema. It:
1. Creates tenant and tenant_users tables
2. Adds tenant_id columns to existing tables
3. Creates a default tenant and migrates existing data
4. Adds foreign key constraints
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'bridge_multitenancy'
down_revision = '0fa7bf3fafaf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenants table
    op.create_table('tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('subdomain', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('subscription_tier', sa.String(length=50), nullable=False),
        sa.Column('subscription_status', sa.String(length=50), nullable=False),
        sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tenants'))
    )
    op.create_index(op.f('ix_tenants_id'), 'tenants', ['id'], unique=False)
    op.create_index(op.f('ix_tenants_name'), 'tenants', ['name'], unique=False)
    op.create_index(op.f('ix_tenants_subdomain'), 'tenants', ['subdomain'], unique=True)

    # Create tenant_users junction table
    op.create_table('tenant_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('OWNER', 'ADMIN', 'MEMBER', 'VIEWER', name='tenantrole'), nullable=False),
        sa.Column('invited_by', sa.Integer(), nullable=True),
        sa.Column('invited_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['invited_by'], ['users.id'], name=op.f('fk_tenant_users_invited_by_users')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name=op.f('fk_tenant_users_tenant_id_tenants'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_tenant_users_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tenant_users'))
    )
    op.create_index(op.f('ix_tenant_users_id'), 'tenant_users', ['id'], unique=False)
    op.create_index(op.f('ix_tenant_users_tenant_id'), 'tenant_users', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tenant_users_user_id'), 'tenant_users', ['user_id'], unique=False)

    # Create default tenant
    op.execute(text("""
        INSERT INTO tenants (name, subdomain, description, is_active, subscription_tier, subscription_status)
        VALUES ('Default Organization', 'default', 'Migrated from single-tenant system', 1, 'enterprise', 'active')
    """))

    # Get the default tenant ID
    default_tenant_id = 1

    # Add tenant_id columns to existing tables (nullable first, then we'll populate and make NOT NULL)
    with op.batch_alter_table('crops', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('budwood_collection', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('grafting_records', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('transfer_records', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    with op.batch_alter_table('order_stage_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    # Create customers and suppliers tables (new in multi-tenant version)
    op.create_table('customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=50), nullable=True),
        sa.Column('zip_code', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('customer_type', sa.String(length=50), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('payment_terms', sa.String(length=50), nullable=True),
        sa.Column('credit_limit', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name=op.f('fk_customers_tenant_id_tenants'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_customers'))
    )
    op.create_index(op.f('ix_customers_company_name'), 'customers', ['company_name'], unique=False)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=False)
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_tenant_id'), 'customers', ['tenant_id'], unique=False)

    op.create_table('suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=50), nullable=True),
        sa.Column('zip_code', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('supplier_type', sa.String(length=50), nullable=True),
        sa.Column('specializations', sa.Text(), nullable=True),
        sa.Column('certifications', sa.Text(), nullable=True),
        sa.Column('quality_rating', sa.Float(), nullable=True),
        sa.Column('delivery_rating', sa.Float(), nullable=True),
        sa.Column('price_rating', sa.Float(), nullable=True),
        sa.Column('payment_terms', sa.String(length=50), nullable=True),
        sa.Column('minimum_order_value', sa.Float(), nullable=True),
        sa.Column('lead_time_days', sa.Integer(), nullable=True),
        sa.Column('shipping_cost', sa.Float(), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_preferred', sa.Boolean(), nullable=True),
        sa.Column('last_order_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_orders', sa.Integer(), nullable=True),
        sa.Column('total_spent', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name=op.f('fk_suppliers_tenant_id_tenants'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_suppliers'))
    )
    op.create_index(op.f('ix_suppliers_company_name'), 'suppliers', ['company_name'], unique=False)
    op.create_index(op.f('ix_suppliers_email'), 'suppliers', ['email'], unique=False)
    op.create_index(op.f('ix_suppliers_id'), 'suppliers', ['id'], unique=False)
    op.create_index(op.f('ix_suppliers_tenant_id'), 'suppliers', ['tenant_id'], unique=False)

    # Create purchase_orders table
    op.create_table('purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('po_number', sa.String(length=50), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('order_date', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('requested_delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('subtotal', sa.Float(), nullable=True),
        sa.Column('tax_amount', sa.Float(), nullable=True),
        sa.Column('shipping_cost', sa.Float(), nullable=True),
        sa.Column('total_amount', sa.Float(), nullable=True),
        sa.Column('delivery_address', sa.Text(), nullable=True),
        sa.Column('delivery_instructions', sa.Text(), nullable=True),
        sa.Column('tracking_number', sa.String(length=100), nullable=True),
        sa.Column('inspection_required', sa.Boolean(), nullable=True),
        sa.Column('inspection_completed', sa.Boolean(), nullable=True),
        sa.Column('inspection_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('received_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], name=op.f('fk_purchase_orders_supplier_id_suppliers')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name=op.f('fk_purchase_orders_tenant_id_tenants'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_purchase_orders'))
    )
    op.create_index(op.f('ix_purchase_orders_id'), 'purchase_orders', ['id'], unique=False)
    op.create_index(op.f('ix_purchase_orders_po_number'), 'purchase_orders', ['po_number'], unique=False)
    op.create_index(op.f('ix_purchase_orders_tenant_id'), 'purchase_orders', ['tenant_id'], unique=False)

    # Additional tables...
    op.create_table('supplier_catalog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('product_type', sa.String(length=50), nullable=False),
        sa.Column('species', sa.String(length=100), nullable=True),
        sa.Column('variety', sa.String(length=100), nullable=False),
        sa.Column('rootstock_type', sa.String(length=100), nullable=True),
        sa.Column('age_months', sa.Integer(), nullable=True),
        sa.Column('size_description', sa.String(length=200), nullable=True),
        sa.Column('container_size', sa.String(length=50), nullable=True),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('minimum_quantity', sa.Integer(), nullable=True),
        sa.Column('availability_season', sa.String(length=100), nullable=True),
        sa.Column('current_stock', sa.Integer(), nullable=True),
        sa.Column('lead_time_days', sa.Integer(), nullable=True),
        sa.Column('quality_grade', sa.String(length=10), nullable=True),
        sa.Column('certifications', sa.Text(), nullable=True),
        sa.Column('disease_tested', sa.Boolean(), nullable=True),
        sa.Column('virus_indexed', sa.Boolean(), nullable=True),
        sa.Column('specifications', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], name=op.f('fk_supplier_catalog_supplier_id_suppliers')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name=op.f('fk_supplier_catalog_tenant_id_tenants'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_supplier_catalog'))
    )
    op.create_index(op.f('ix_supplier_catalog_id'), 'supplier_catalog', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_catalog_tenant_id'), 'supplier_catalog', ['tenant_id'], unique=False)

    # Populate tenant_id for existing records
    op.execute(text(f"UPDATE crops SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE orders SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE tasks SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE budwood_collection SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE grafting_records SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE transfer_records SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))
    op.execute(text(f"UPDATE order_stage_history SET tenant_id = {default_tenant_id} WHERE tenant_id IS NULL"))

    # Make tenant_id NOT NULL and add foreign keys
    with op.batch_alter_table('crops', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_crops_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_crops_tenant_id', ['tenant_id'])

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_orders_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_orders_tenant_id', ['tenant_id'])
        # Make order_number non-unique (unique per tenant now)
        batch_op.drop_index('ix_orders_order_number')
        batch_op.create_index('ix_orders_order_number', ['order_number'], unique=False)

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_tasks_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_tasks_tenant_id', ['tenant_id'])

    with op.batch_alter_table('budwood_collection', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_budwood_collection_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_budwood_collection_tenant_id', ['tenant_id'])

    with op.batch_alter_table('grafting_records', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_grafting_records_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_grafting_records_tenant_id', ['tenant_id'])

    with op.batch_alter_table('transfer_records', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_transfer_records_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_transfer_records_tenant_id', ['tenant_id'])

    with op.batch_alter_table('order_stage_history', schema=None) as batch_op:
        batch_op.alter_column('tenant_id', nullable=False)
        batch_op.create_foreign_key('fk_order_stage_history_tenant_id_tenants', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_order_stage_history_tenant_id', ['tenant_id'])

    # Assign all existing users to the default tenant as OWNERS
    op.execute(text(f"""
        INSERT INTO tenant_users (tenant_id, user_id, role, is_active, joined_at)
        SELECT {default_tenant_id}, id, 'OWNER', 1, CURRENT_TIMESTAMP
        FROM users
        WHERE NOT is_superuser
    """))


def downgrade() -> None:
    # This downgrade removes multi-tenancy - use with caution!
    with op.batch_alter_table('order_stage_history', schema=None) as batch_op:
        batch_op.drop_index('ix_order_stage_history_tenant_id')
        batch_op.drop_constraint('fk_order_stage_history_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('transfer_records', schema=None) as batch_op:
        batch_op.drop_index('ix_transfer_records_tenant_id')
        batch_op.drop_constraint('fk_transfer_records_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('grafting_records', schema=None) as batch_op:
        batch_op.drop_index('ix_grafting_records_tenant_id')
        batch_op.drop_constraint('fk_grafting_records_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('budwood_collection', schema=None) as batch_op:
        batch_op.drop_index('ix_budwood_collection_tenant_id')
        batch_op.drop_constraint('fk_budwood_collection_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_index('ix_tasks_tenant_id')
        batch_op.drop_constraint('fk_tasks_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_index('ix_orders_tenant_id')
        batch_op.drop_index('ix_orders_order_number')
        batch_op.create_index('ix_orders_order_number', ['order_number'], unique=True)
        batch_op.drop_constraint('fk_orders_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('crops', schema=None) as batch_op:
        batch_op.drop_index('ix_crops_tenant_id')
        batch_op.drop_constraint('fk_crops_tenant_id_tenants', type_='foreignkey')
        batch_op.drop_column('tenant_id')

    # Drop new tables
    op.drop_table('supplier_catalog')
    op.drop_table('purchase_orders')
    op.drop_table('suppliers')
    op.drop_table('customers')
    op.drop_table('tenant_users')
    op.drop_table('tenants')
