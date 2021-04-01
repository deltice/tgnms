# Copyright (c) 2014-present, Facebook, Inc.
"""create_tables

Revision ID: 0000
Revises:
Create Date: 2020-11-25 22:51:37.109551

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "0000"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "network_health_execution",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "start_dt", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_network_health_execution_start_dt"),
        "network_health_execution",
        ["start_dt"],
        unique=False,
    )
    op.create_table(
        "network_stats_health",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("execution_id", sa.Integer(), nullable=False),
        sa.Column("network_name", sa.String(length=255), nullable=False),
        sa.Column("link_name", sa.String(length=255), nullable=True),
        sa.Column("node_name", sa.String(length=255), nullable=True),
        sa.Column("stats_health", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["execution_id"], ["network_health_execution.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_network_stats_health_network_name"),
        "network_stats_health",
        ["network_name"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(
        op.f("ix_network_stats_health_network_name"), table_name="network_stats_health"
    )
    op.drop_table("network_stats_health")
    op.drop_index(
        op.f("ix_network_health_execution_start_dt"),
        table_name="network_health_execution",
    )
    op.drop_table("network_health_execution")
    # ### end Alembic commands ###