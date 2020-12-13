"""Add profile picture url to user model

Revision ID: 97384747c74a
Revises: 997576219c86
Create Date: 2020-08-28 19:09:39.104831

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '97384747c74a'
down_revision = '997576219c86'
branch_labels = None
depends_on = None


def upgrade():
    pass
    # ### commands auto generated by Alembic - please adjust! ###
    # with op.batch_alter_table('user', schema=None) as batch_op:
        # batch_op.add_column(sa.Column('profile_picture_url', sa.String(length=250), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_seen', sa.DATETIME(), nullable=True))
        batch_op.drop_column('profile_picture_url')

    # ### end Alembic commands ###
