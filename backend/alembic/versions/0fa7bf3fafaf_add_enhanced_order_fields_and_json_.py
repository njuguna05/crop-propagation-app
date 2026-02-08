"""Add enhanced order fields and JSON column types

Revision ID: 0fa7bf3fafaf
Revises: a7932da89ca8
Create Date: 2026-02-08 19:00:06.957812

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0fa7bf3fafaf'
down_revision = 'a7932da89ca8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('order_stage_history', sa.Column('worker_performance', sa.JSON(), nullable=True))
    op.add_column('orders', sa.Column('budwood_calculation', sa.JSON(), nullable=True))
    op.add_column('orders', sa.Column('worker_assignments', sa.JSON(), nullable=True))
    op.add_column('orders', sa.Column('stage_validation', sa.JSON(), nullable=True))
    # Use USING clause for TEXT -> JSON conversion in PostgreSQL
    op.execute('ALTER TABLE orders ALTER COLUMN notes TYPE JSON USING notes::json')
    op.execute('ALTER TABLE orders ALTER COLUMN specifications TYPE JSON USING specifications::json')


def downgrade() -> None:
    op.alter_column('orders', 'specifications',
               existing_type=sa.JSON(),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('orders', 'notes',
               existing_type=sa.JSON(),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.drop_column('orders', 'stage_validation')
    op.drop_column('orders', 'worker_assignments')
    op.drop_column('orders', 'budwood_calculation')
    op.drop_column('order_stage_history', 'worker_performance')
