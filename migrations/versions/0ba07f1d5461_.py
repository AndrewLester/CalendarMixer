"""empty message

Revision ID: 0ba07f1d5461
Revises: 596a682ea94f
Create Date: 2019-09-18 16:12:56.884503

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0ba07f1d5461'
down_revision = '596a682ea94f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('ical_secret', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_user_ical_secret'), 'user', ['ical_secret'], unique=True)
    op.drop_column('user', 'password_hash')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('password_hash', sa.VARCHAR(length=128), nullable=True))
    op.drop_index(op.f('ix_user_ical_secret'), table_name='user')
    op.drop_column('user', 'ical_secret')
    # ### end Alembic commands ###
