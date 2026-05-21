"""initial schema"""

from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                CREATE TYPE user_role AS ENUM ('volunteer', 'fund', 'admin');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fund_status') THEN
                CREATE TYPE fund_status AS ENUM ('draft', 'pending_review', 'approved', 'needs_changes', 'rejected');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'help_category') THEN
                CREATE TYPE help_category AS ENUM ('children', 'elderly', 'disability', 'ecology', 'events', 'logistics', 'it', 'design', 'legal', 'communications', 'content', 'education', 'sport', 'targeted_help', 'pro_bono');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participation_format') THEN
                CREATE TYPE participation_format AS ENUM ('online', 'offline');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duration_type') THEN
                CREATE TYPE duration_type AS ENUM ('one_time', 'regular', 'long_term');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
                CREATE TYPE task_type AS ENUM ('regular', 'pro_bono');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
                CREATE TYPE task_status AS ENUM ('draft', 'pending_review', 'published', 'needs_changes', 'rejected', 'closed');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
                CREATE TYPE application_status AS ENUM ('applied', 'accepted', 'rejected', 'canceled', 'completion_confirmed', 'hours_awarded');
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS mock_employee (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id VARCHAR(80) NOT NULL UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            full_name VARCHAR(255) NOT NULL,
            city VARCHAR(120),
            department VARCHAR(160),
            position VARCHAR(160),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS app_user (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role user_role NOT NULL,
            username VARCHAR(80) UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            city VARCHAR(120),
            phone VARCHAR(40),
            employee_id VARCHAR(80) UNIQUE,
            department VARCHAR(160),
            position VARCHAR(160),
            interests TEXT[],
            skills TEXT[],
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS fund (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            representative_user_id UUID NOT NULL UNIQUE REFERENCES app_user(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            help_categories TEXT[],
            inn VARCHAR(12),
            ogrn VARCHAR(15),
            region VARCHAR(160),
            website_url VARCHAR(500),
            contact_person VARCHAR(255),
            contact_position VARCHAR(160),
            contact_email VARCHAR(320),
            contact_phone VARCHAR(40),
            planned_help TEXT,
            status fund_status NOT NULL DEFAULT 'draft',
            moderation_comment TEXT,
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS fund_document (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fund_id UUID NOT NULL REFERENCES fund(id) ON DELETE CASCADE,
            document_type VARCHAR(120) NOT NULL,
            file_url VARCHAR(700) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS volunteer_task (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fund_id UUID NOT NULL REFERENCES fund(id),
            title VARCHAR(220) NOT NULL,
            description TEXT NOT NULL,
            category help_category NOT NULL,
            participation_format participation_format NOT NULL,
            duration_type duration_type NOT NULL,
            task_type task_type NOT NULL DEFAULT 'regular',
            city VARCHAR(120),
            location VARCHAR(500),
            online_url VARCHAR(700),
            starts_at TIMESTAMPTZ,
            ends_at TIMESTAMPTZ,
            deadline_at TIMESTAMPTZ,
            participant_limit INTEGER,
            requirements TEXT,
            required_skills TEXT[],
            expected_hours NUMERIC(5, 2) NOT NULL CHECK (expected_hours > 0),
            materials_url VARCHAR(700),
            status task_status NOT NULL DEFAULT 'draft',
            moderation_comment TEXT,
            published_at TIMESTAMPTZ,
            closed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT task_participant_limit_positive CHECK (participant_limit IS NULL OR participant_limit > 0),
            CONSTRAINT task_offline_city_required CHECK (participation_format = 'online' OR city IS NOT NULL)
        );

        CREATE TABLE IF NOT EXISTS task_application (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES volunteer_task(id) ON DELETE CASCADE,
            volunteer_id UUID NOT NULL REFERENCES app_user(id),
            status application_status NOT NULL DEFAULT 'applied',
            volunteer_comment TEXT,
            fund_comment TEXT,
            decided_at TIMESTAMPTZ,
            canceled_at TIMESTAMPTZ,
            completion_confirmed_at TIMESTAMPTZ,
            completion_comment TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS task_application_active_unique
            ON task_application (task_id, volunteer_id)
            WHERE status <> 'canceled';

        CREATE TABLE IF NOT EXISTS volunteer_hour_ledger (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL UNIQUE REFERENCES task_application(id),
            volunteer_id UUID NOT NULL REFERENCES app_user(id),
            task_id UUID NOT NULL REFERENCES volunteer_task(id),
            hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
            awarded_by UUID NOT NULL REFERENCES app_user(id),
            awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            admin_comment TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS notification (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
            title VARCHAR(160) NOT NULL,
            body TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS report_export (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            requested_by UUID NOT NULL REFERENCES app_user(id),
            report_type VARCHAR(120) NOT NULL,
            filters JSONB NOT NULL DEFAULT '{}'::jsonb,
            file_url VARCHAR(700),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS app_user_role_idx ON app_user (role);
        CREATE INDEX IF NOT EXISTS ix_app_user_username ON app_user (username);
        CREATE INDEX IF NOT EXISTS fund_status_idx ON fund (status);
        CREATE INDEX IF NOT EXISTS volunteer_task_feed_idx
            ON volunteer_task (status, city, category, participation_format, duration_type, task_type);
        CREATE INDEX IF NOT EXISTS task_application_status_idx ON task_application (status);
        CREATE INDEX IF NOT EXISTS hour_ledger_volunteer_idx ON volunteer_hour_ledger (volunteer_id);

        CREATE OR REPLACE VIEW admin_participant_report AS
        SELECT
            u.id AS volunteer_id,
            u.full_name,
            u.email,
            u.city,
            u.department,
            u.position,
            u.created_at AS registered_at,
            count(DISTINCT a.id) AS applications_count,
            count(DISTINCT h.id) AS completed_tasks_count,
            coalesce(sum(h.hours), 0) AS awarded_hours
        FROM app_user u
        LEFT JOIN task_application a ON a.volunteer_id = u.id
        LEFT JOIN volunteer_hour_ledger h ON h.volunteer_id = u.id
        WHERE u.role = 'volunteer'
        GROUP BY u.id;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP VIEW IF EXISTS admin_participant_report;
        DROP TABLE IF EXISTS report_export CASCADE;
        DROP TABLE IF EXISTS notification CASCADE;
        DROP TABLE IF EXISTS volunteer_hour_ledger CASCADE;
        DROP TABLE IF EXISTS task_application CASCADE;
        DROP TABLE IF EXISTS volunteer_task CASCADE;
        DROP TABLE IF EXISTS fund_document CASCADE;
        DROP TABLE IF EXISTS fund CASCADE;
        DROP TABLE IF EXISTS app_user CASCADE;
        DROP TABLE IF EXISTS mock_employee CASCADE;
        DROP TYPE IF EXISTS application_status;
        DROP TYPE IF EXISTS task_status;
        DROP TYPE IF EXISTS task_type;
        DROP TYPE IF EXISTS duration_type;
        DROP TYPE IF EXISTS participation_format;
        DROP TYPE IF EXISTS help_category;
        DROP TYPE IF EXISTS fund_status;
        DROP TYPE IF EXISTS user_role;
        """
    )
