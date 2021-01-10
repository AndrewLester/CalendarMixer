"""Give CourseColor model a surrogate primary key

Revision ID: 3b1313f68c55
Revises: dd81b058eea1
Create Date: 2020-11-03 16:51:03.634727

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b1313f68c55'
down_revision = 'dd81b058eea1'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('course_color')
    
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('course_color',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('course_id', sa.String(length=36), nullable=False),
    sa.Column('color', sa.String(length=30), nullable=True),
    sa.ForeignKeyConstraint(['course_id'], ['course_identifier.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('course_color', schema=None) as batch_op:
        batch_op.drop_column('id')

    # ### end Alembic commands ###