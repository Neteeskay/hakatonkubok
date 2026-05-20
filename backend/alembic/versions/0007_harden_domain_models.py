"""harden domain models"""

from alembic import op


revision = "0007_harden_domain_models"
down_revision = "0006_user_achievements"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE app_user
            ALTER COLUMN is_active SET DEFAULT TRUE;
        ALTER TABLE stoloto_employee
            ALTER COLUMN is_active SET DEFAULT TRUE;
        ALTER TABLE fund
            ALTER COLUMN status SET DEFAULT 'draft';
        ALTER TABLE volunteer_task
            ALTER COLUMN task_type SET DEFAULT 'regular',
            ALTER COLUMN status SET DEFAULT 'draft',
            ALTER COLUMN approved_at DROP NOT NULL;
        ALTER TABLE task_application
            ALTER COLUMN status SET DEFAULT 'applied';
        ALTER TABLE notification
            ALTER COLUMN is_read SET DEFAULT FALSE;

        ALTER TABLE fund_document
            DROP CONSTRAINT IF EXISTS fund_document_fund_id_fkey;
        ALTER TABLE fund_document
            ADD CONSTRAINT fund_document_fund_id_fkey
            FOREIGN KEY (fund_id) REFERENCES fund(id) ON DELETE CASCADE;

        ALTER TABLE task_application
            DROP CONSTRAINT IF EXISTS task_application_task_id_fkey;
        ALTER TABLE task_application
            ADD CONSTRAINT task_application_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES volunteer_task(id) ON DELETE CASCADE;

        ALTER TABLE volunteer_hour_ledger
            DROP CONSTRAINT IF EXISTS volunteer_hour_ledger_application_id_fkey;
        ALTER TABLE volunteer_hour_ledger
            ADD CONSTRAINT volunteer_hour_ledger_application_id_fkey
            FOREIGN KEY (application_id) REFERENCES task_application(id) ON DELETE CASCADE;

        ALTER TABLE volunteer_hour_ledger
            DROP CONSTRAINT IF EXISTS volunteer_hour_ledger_task_id_fkey;
        ALTER TABLE volunteer_hour_ledger
            ADD CONSTRAINT volunteer_hour_ledger_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES volunteer_task(id) ON DELETE CASCADE;

        ALTER TABLE report_export
            DROP CONSTRAINT IF EXISTS report_export_requested_by_fkey;
        ALTER TABLE report_export
            ADD CONSTRAINT report_export_requested_by_fkey
            FOREIGN KEY (requested_by) REFERENCES app_user(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS task_application_volunteer_created_idx
            ON task_application (volunteer_id, created_at);
        CREATE INDEX IF NOT EXISTS volunteer_task_fund_status_idx
            ON volunteer_task (fund_id, status, created_at);
        CREATE INDEX IF NOT EXISTS hour_ledger_volunteer_awarded_idx
            ON volunteer_hour_ledger (volunteer_id, awarded_at);
        CREATE INDEX IF NOT EXISTS notification_user_created_idx
            ON notification (user_id, created_at);
        CREATE INDEX IF NOT EXISTS report_export_requester_created_idx
            ON report_export (requested_by, created_at);
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_expected_hours_positive'
            ) THEN
                ALTER TABLE volunteer_task
                    ADD CONSTRAINT task_expected_hours_positive
                    CHECK (expected_hours > 0) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_dates_order_valid'
            ) THEN
                ALTER TABLE volunteer_task
                    ADD CONSTRAINT task_dates_order_valid
                    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_deadline_before_start_valid'
            ) THEN
                ALTER TABLE volunteer_task
                    ADD CONSTRAINT task_deadline_before_start_valid
                    CHECK (
                        starts_at IS NULL OR deadline_at IS NULL OR deadline_at <= starts_at
                    ) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_published_dates_required'
            ) THEN
                ALTER TABLE volunteer_task
                    ADD CONSTRAINT task_published_dates_required
                    CHECK (
                        status <> 'published'
                        OR (published_at IS NOT NULL AND approved_at IS NOT NULL)
                    ) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_application_canceled_at_required'
            ) THEN
                ALTER TABLE task_application
                    ADD CONSTRAINT task_application_canceled_at_required
                    CHECK (status <> 'canceled' OR canceled_at IS NOT NULL) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_application_decided_at_required'
            ) THEN
                ALTER TABLE task_application
                    ADD CONSTRAINT task_application_decided_at_required
                    CHECK (
                        status NOT IN (
                            'accepted',
                            'rejected',
                            'completion_confirmed',
                            'hours_awarded'
                        )
                        OR decided_at IS NOT NULL
                    ) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'task_application_completion_at_required'
            ) THEN
                ALTER TABLE task_application
                    ADD CONSTRAINT task_application_completion_at_required
                    CHECK (
                        status NOT IN ('completion_confirmed', 'hours_awarded')
                        OR completion_confirmed_at IS NOT NULL
                    ) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'hour_ledger_hours_positive'
            ) THEN
                ALTER TABLE volunteer_hour_ledger
                    ADD CONSTRAINT hour_ledger_hours_positive
                    CHECK (hours > 0) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'user_achievement_code_valid'
            ) THEN
                ALTER TABLE user_achievement
                    ADD CONSTRAINT user_achievement_code_valid
                    CHECK (
                        achievement_code IN (
                            'first_steps',
                            'hours_5',
                            'hours_10',
                            'hours_25',
                            'hours_50',
                            'hours_100',
                            'first_response',
                            'fast_response',
                            'active_participant',
                            'regular_helper',
                            'good_marathon',
                            'online_volunteer',
                            'offline_hero',
                            'pro_bono_expert',
                            'eco_hero',
                            'children_kindness',
                            'support_nearby',
                            'reliable_volunteer',
                            'team_player',
                            'prosto_legend'
                        )
                    ) NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'user_achievement_progress_valid'
            ) THEN
                ALTER TABLE user_achievement
                    ADD CONSTRAINT user_achievement_progress_valid
                    CHECK (progress_current >= 0 AND progress_target > 0) NOT VALID;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS report_export_requester_created_idx;
        DROP INDEX IF EXISTS notification_user_created_idx;
        DROP INDEX IF EXISTS hour_ledger_volunteer_awarded_idx;
        DROP INDEX IF EXISTS volunteer_task_fund_status_idx;
        DROP INDEX IF EXISTS task_application_volunteer_created_idx;

        ALTER TABLE user_achievement
            DROP CONSTRAINT IF EXISTS user_achievement_progress_valid,
            DROP CONSTRAINT IF EXISTS user_achievement_code_valid;
        ALTER TABLE volunteer_hour_ledger
            DROP CONSTRAINT IF EXISTS hour_ledger_hours_positive;
        ALTER TABLE task_application
            DROP CONSTRAINT IF EXISTS task_application_completion_at_required,
            DROP CONSTRAINT IF EXISTS task_application_decided_at_required,
            DROP CONSTRAINT IF EXISTS task_application_canceled_at_required;
        ALTER TABLE volunteer_task
            DROP CONSTRAINT IF EXISTS task_published_dates_required,
            DROP CONSTRAINT IF EXISTS task_deadline_before_start_valid,
            DROP CONSTRAINT IF EXISTS task_dates_order_valid,
            DROP CONSTRAINT IF EXISTS task_expected_hours_positive;

        ALTER TABLE report_export
            DROP CONSTRAINT IF EXISTS report_export_requested_by_fkey;
        ALTER TABLE report_export
            ADD CONSTRAINT report_export_requested_by_fkey
            FOREIGN KEY (requested_by) REFERENCES app_user(id);

        ALTER TABLE volunteer_hour_ledger
            DROP CONSTRAINT IF EXISTS volunteer_hour_ledger_task_id_fkey;
        ALTER TABLE volunteer_hour_ledger
            ADD CONSTRAINT volunteer_hour_ledger_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES volunteer_task(id);

        ALTER TABLE volunteer_hour_ledger
            DROP CONSTRAINT IF EXISTS volunteer_hour_ledger_application_id_fkey;
        ALTER TABLE volunteer_hour_ledger
            ADD CONSTRAINT volunteer_hour_ledger_application_id_fkey
            FOREIGN KEY (application_id) REFERENCES task_application(id);

        ALTER TABLE task_application
            DROP CONSTRAINT IF EXISTS task_application_task_id_fkey;
        ALTER TABLE task_application
            ADD CONSTRAINT task_application_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES volunteer_task(id) ON DELETE CASCADE;

        ALTER TABLE fund_document
            DROP CONSTRAINT IF EXISTS fund_document_fund_id_fkey;
        ALTER TABLE fund_document
            ADD CONSTRAINT fund_document_fund_id_fkey
            FOREIGN KEY (fund_id) REFERENCES fund(id) ON DELETE CASCADE;
        """
    )
