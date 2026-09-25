"""add official_domain logo_provider and logo_status to companies and dsa_companies

Revision ID: b41f98d28a11
Revises: 00ff0dc07583
Create Date: 2026-09-11 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b41f98d28a11'
down_revision: Union[str, None] = '00ff0dc07583'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to companies (user pipeline companies)
    op.add_column('companies', sa.Column('official_domain', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('logo_provider', sa.String(), server_default='logo.dev', nullable=True))
    op.add_column('companies', sa.Column('logo_status', sa.String(), server_default='UNVERIFIED', nullable=False))
    op.create_index(op.f('ix_companies_official_domain'), 'companies', ['official_domain'], unique=False)

    # 2. Add columns to dsa_companies (catalog companies)
    op.add_column('dsa_companies', sa.Column('official_domain', sa.String(), nullable=True))
    op.add_column('dsa_companies', sa.Column('logo_provider', sa.String(), server_default='logo.dev', nullable=True))
    op.add_column('dsa_companies', sa.Column('logo_status', sa.String(), server_default='UNVERIFIED', nullable=False))
    op.create_index(op.f('ix_dsa_companies_official_domain'), 'dsa_companies', ['official_domain'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_dsa_companies_official_domain'), table_name='dsa_companies')
    op.drop_column('dsa_companies', 'logo_status')
    op.drop_column('dsa_companies', 'logo_provider')
    op.drop_column('dsa_companies', 'official_domain')

    op.drop_index(op.f('ix_companies_official_domain'), table_name='companies')
    op.drop_column('companies', 'logo_status')
    op.drop_column('companies', 'logo_provider')
    op.drop_column('companies', 'official_domain')
