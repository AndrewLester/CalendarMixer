"""new user table

Revision ID: 7c1f73bb3770
Revises: b17439e774fd
Create Date: 2019-05-30 17:58:22.660263

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7c1f73bb3770'
down_revision = 'b17439e774fd'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('o_auth1_token',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=20), nullable=False),
    sa.Column('oauth_token', sa.String(length=48), nullable=False),
    sa.Column('oauth_token_secret', sa.String(length=48), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('o_auth1_token')
    # ### end Alembic commands ###
