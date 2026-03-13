"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("doc_type", sa.Enum("자기소개서", "경력기술서", "지원서", name="doctype"), nullable=False),
        sa.Column("org_type", sa.Enum("PUBLIC", "PRIVATE", name="orgtype"), nullable=False),
        sa.Column("company_name", sa.String(200)),
        sa.Column("result_label", sa.Enum("PASS", "FAIL", name="resultlabel")),
        sa.Column("parsed_markdown", sa.Text),
        sa.Column("structured_json", JSONB),
        sa.Column("embedding_id", sa.String(200)),
        sa.Column("created_at", sa.DateTime),
    )

    op.create_table(
        "evaluation_rubrics",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("rubric_name", sa.String(100), unique=True, nullable=False),
        sa.Column("org_type", sa.Enum("PUBLIC", "PRIVATE", name="orgtype"), nullable=True),
        sa.Column("dimension", sa.String(100)),
        sa.Column("score_1_desc", sa.Text),
        sa.Column("score_2_desc", sa.Text),
        sa.Column("score_3_desc", sa.Text),
        sa.Column("score_4_desc", sa.Text),
        sa.Column("score_5_desc", sa.Text),
        sa.Column("weight", sa.Float, default=1.0),
    )

    op.create_table(
        "gleaning_sessions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("document_id", UUID(as_uuid=False), sa.ForeignKey("documents.id")),
        sa.Column("initial_score", sa.Float),
        sa.Column("final_score", sa.Float),
        sa.Column("total_iterations", sa.Integer, default=0),
        sa.Column("status", sa.Enum("RUNNING", "PASSED", "MAX_ITER", name="gleaningstatus"), default="RUNNING"),
        sa.Column("rewrite_log", JSONB),
        sa.Column("created_at", sa.DateTime),
    )

    op.create_table(
        "evaluation_results",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("document_id", UUID(as_uuid=False), sa.ForeignKey("documents.id")),
        sa.Column("rubric_id", UUID(as_uuid=False), sa.ForeignKey("evaluation_rubrics.id"), nullable=True),
        sa.Column("gleaning_session_id", UUID(as_uuid=False), sa.ForeignKey("gleaning_sessions.id"), nullable=True),
        sa.Column("iteration_num", sa.Integer, default=1),
        sa.Column("dimension_scores", JSONB),
        sa.Column("total_score", sa.Float),
        sa.Column("pass_fail", sa.Boolean),
        sa.Column("feedback_json", JSONB),
        sa.Column("created_at", sa.DateTime),
    )

    op.create_table(
        "training_datasets",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("dataset_type", sa.Enum("SFT", "DPO", name="datasettype"), nullable=False),
        sa.Column("source_doc_id", UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("prompt", sa.Text),
        sa.Column("chosen", sa.Text),
        sa.Column("rejected", sa.Text, nullable=True),
        sa.Column("reward_score", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime),
    )

    op.create_table(
        "doc_style_patterns",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("org_type", sa.Enum("PUBLIC", "PRIVATE", name="orgtype"), nullable=False),
        sa.Column("section_structure", JSONB),
        sa.Column("writing_rules", JSONB),
        sa.Column("keyword_patterns", JSONB),
        sa.Column("tone_profile", JSONB),
        sa.Column("pass_rate", sa.Float),
        sa.Column("updated_at", sa.DateTime),
    )


def downgrade() -> None:
    op.drop_table("doc_style_patterns")
    op.drop_table("training_datasets")
    op.drop_table("evaluation_results")
    op.drop_table("gleaning_sessions")
    op.drop_table("evaluation_rubrics")
    op.drop_table("documents")
    op.execute("DROP TYPE IF EXISTS doctype")
    op.execute("DROP TYPE IF EXISTS orgtype")
    op.execute("DROP TYPE IF EXISTS resultlabel")
    op.execute("DROP TYPE IF EXISTS gleaningstatus")
    op.execute("DROP TYPE IF EXISTS datasettype")
