"""add user management fields

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-11-18 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c4d5e6f7a8b'
down_revision: Union[str, None] = '2b3c4d5e6f7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('blocked_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('blocked_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('blocked_reason', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('deleted_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('deletion_reason', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('last_login_at', sa.DateTime(), nullable=True))
        batch_op.create_index('ix_users_is_blocked', ['is_blocked'], unique=False)
        batch_op.create_index('ix_users_is_deleted', ['is_deleted'], unique=False)
        batch_op.create_index('ix_users_role', ['role'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_role')
        batch_op.drop_index('ix_users_is_deleted')
        batch_op.drop_index('ix_users_is_blocked')
        batch_op.drop_column('last_login_at')
        batch_op.drop_column('deletion_reason')
        batch_op.drop_column('deleted_by_id')
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('is_deleted')
        batch_op.drop_column('blocked_reason')
        batch_op.drop_column('blocked_by_id')
        batch_op.drop_column('blocked_at')
        batch_op.drop_column('is_blocked')