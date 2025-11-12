"""add first_played to usersdaily

Revision ID: 6cfc1ac9d42c
Revises: 74e63e0c8e89
Create Date: 2025-11-12 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6cfc1ac9d42c'
down_revision: Union[str, None] = '74e63e0c8e89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # safeguard so prod (where column was hotfixed) and dev (where it wasn't) both succeed
    op.execute("ALTER TABLE usersdaily ADD COLUMN IF NOT EXISTS first_played DATE")
    op.execute(
        "UPDATE usersdaily SET first_played = last_played "
        "WHERE first_played IS NULL AND last_played IS NOT NULL"
    )


def downgrade() -> None:
    op.drop_column('usersdaily', 'first_played')
