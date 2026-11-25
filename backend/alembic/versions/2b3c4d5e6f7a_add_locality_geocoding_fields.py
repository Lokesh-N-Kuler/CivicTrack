"""add locality and geocoding fields to complaints

Revision ID: 2b3c4d5e6f7a
Revises: 146f8e2f5d35
Create Date: 2026-11-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b3c4d5e6f7a'
down_revision: Union[str, None] = '146f8e2f5d35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('complaints', schema=None) as batch_op:
        batch_op.add_column(sa.Column('locality', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('geocoding_id', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('selection_method', sa.String(length=50), nullable=True, server_default='search'))
        batch_op.create_index('ix_complaints_locality', ['locality'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('complaints', schema=None) as batch_op:
        batch_op.drop_index('ix_complaints_locality')
        batch_op.drop_column('selection_method')
        batch_op.drop_column('geocoding_id')
        batch_op.drop_column('locality')

