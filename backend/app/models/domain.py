from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    ApplicationStatus,
    DurationType,
    FundStatus,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
    UserRole,
)


def enum_values(enum_cls: type) -> list[str]:
    return [item.value for item in enum_cls]


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class User(Base, TimestampMixin):
    __tablename__ = "app_user"
    __table_args__ = (Index("app_user_role_idx", "role"),)

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=enum_values),
        nullable=False,
    )
    username: Mapped[str | None] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(40))
    employee_id: Mapped[str | None] = mapped_column(String(80), unique=True)
    department: Mapped[str | None] = mapped_column(String(160))
    position: Mapped[str | None] = mapped_column(String(160))
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    skills: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    fund: Mapped["Fund | None"] = relationship(back_populates="representative")
    applications: Mapped[list["TaskApplication"]] = relationship(back_populates="volunteer")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    report_exports: Mapped[list["ReportExport"]] = relationship(back_populates="requester")


class StolotoEmployee(Base, TimestampMixin):
    __tablename__ = "stoloto_employee"

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    employee_id: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str | None] = mapped_column(String(120))
    department: Mapped[str | None] = mapped_column(String(160))
    position: Mapped[str | None] = mapped_column(String(160))
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)


class Fund(Base, TimestampMixin):
    __tablename__ = "fund"
    __table_args__ = (Index("fund_status_idx", "status"),)

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    representative_user_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id"),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    help_categories: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    inn: Mapped[str | None] = mapped_column(String(12))
    ogrn: Mapped[str | None] = mapped_column(String(15))
    region: Mapped[str | None] = mapped_column(String(160))
    website_url: Mapped[str | None] = mapped_column(String(500))
    contact_person: Mapped[str | None] = mapped_column(String(255))
    contact_position: Mapped[str | None] = mapped_column(String(160))
    contact_email: Mapped[str | None] = mapped_column(String(320))
    contact_phone: Mapped[str | None] = mapped_column(String(40))
    planned_help: Mapped[str | None] = mapped_column(Text)
    status: Mapped[FundStatus] = mapped_column(
        Enum(FundStatus, name="fund_status", values_callable=enum_values),
        default=FundStatus.DRAFT,
        nullable=False,
    )
    moderation_comment: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    representative: Mapped[User] = relationship(back_populates="fund")
    documents: Mapped[list["FundDocument"]] = relationship(back_populates="fund")
    tasks: Mapped[list["VolunteerTask"]] = relationship(back_populates="fund")


class FundDocument(Base, TimestampMixin):
    __tablename__ = "fund_document"

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    fund_id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("fund.id"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_url: Mapped[str] = mapped_column(String(700), nullable=False)

    fund: Mapped[Fund] = relationship(back_populates="documents")


class VolunteerTask(Base, TimestampMixin):
    __tablename__ = "volunteer_task"
    __table_args__ = (
        CheckConstraint("participant_limit IS NULL OR participant_limit > 0", name="task_participant_limit_positive"),
        CheckConstraint(
            "participation_format = 'online' OR city IS NOT NULL",
            name="task_offline_city_required",
        ),
        Index(
            "volunteer_task_feed_idx",
            "status",
            "city",
            "category",
            "participation_format",
            "duration_type",
            "task_type",
        ),
    )

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    fund_id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("fund.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[HelpCategory] = mapped_column(
        Enum(HelpCategory, name="help_category", values_callable=enum_values),
        nullable=False,
    )
    participation_format: Mapped[ParticipationFormat] = mapped_column(
        Enum(ParticipationFormat, name="participation_format", values_callable=enum_values),
        nullable=False,
    )
    duration_type: Mapped[DurationType] = mapped_column(
        Enum(DurationType, name="duration_type", values_callable=enum_values),
        nullable=False,
    )
    task_type: Mapped[TaskType] = mapped_column(
        Enum(TaskType, name="task_type", values_callable=enum_values),
        default=TaskType.REGULAR,
        nullable=False,
    )
    city: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(500))
    online_url: Mapped[str | None] = mapped_column(String(700))
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    participant_limit: Mapped[int | None] = mapped_column(Integer)
    requirements: Mapped[str | None] = mapped_column(Text)
    required_skills: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    expected_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    materials_url: Mapped[str | None] = mapped_column(String(700))
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status", values_callable=enum_values),
        default=TaskStatus.DRAFT,
        nullable=False,
    )
    moderation_comment: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    fund: Mapped[Fund] = relationship(back_populates="tasks")
    applications: Mapped[list["TaskApplication"]] = relationship(back_populates="task")


class TaskApplication(Base, TimestampMixin):
    __tablename__ = "task_application"
    __table_args__ = (
        Index(
            "task_application_active_unique",
            "task_id",
            "volunteer_id",
            unique=True,
            postgresql_where=text("status <> 'canceled'"),
        ),
        Index("task_application_status_idx", "status"),
    )

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("volunteer_task.id"),
        nullable=False,
    )
    volunteer_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id"),
        nullable=False,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status", values_callable=enum_values),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    volunteer_comment: Mapped[str | None] = mapped_column(Text)
    fund_comment: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_comment: Mapped[str | None] = mapped_column(Text)

    task: Mapped[VolunteerTask] = relationship(back_populates="applications")
    volunteer: Mapped[User] = relationship(back_populates="applications")
    hour_ledger: Mapped["VolunteerHourLedger | None"] = relationship(back_populates="application")


class VolunteerHourLedger(Base, TimestampMixin):
    __tablename__ = "volunteer_hour_ledger"
    __table_args__ = (Index("hour_ledger_volunteer_idx", "volunteer_id"),)

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("task_application.id"),
        unique=True,
        nullable=False,
    )
    volunteer_id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("app_user.id"))
    task_id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("volunteer_task.id"))
    hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    awarded_by: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("app_user.id"))
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    admin_comment: Mapped[str | None] = mapped_column(Text)

    application: Mapped[TaskApplication] = relationship(back_populates="hour_ledger")


class UserAchievement(Base, TimestampMixin):
    __tablename__ = "user_achievement"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_code", name="user_achievement_user_code_key"),
        Index("user_achievement_user_idx", "user_id"),
    )

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE"),
        nullable=False,
    )
    achievement_code: Mapped[str] = mapped_column(String(80), nullable=False)
    progress_current: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    progress_target: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=1, nullable=False)
    achievement_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="achievements")


class Notification(Base):
    __tablename__ = "notification"

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="notifications")


class ReportExport(Base):
    __tablename__ = "report_export"

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    requested_by: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id"),
        nullable=False,
    )
    report_type: Mapped[str] = mapped_column(String(120), nullable=False)
    filters: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    file_url: Mapped[str | None] = mapped_column(String(700))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    requester: Mapped[User] = relationship(back_populates="report_exports")


