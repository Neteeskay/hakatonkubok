from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
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

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=enum_values),
        nullable=False,
    )
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


class Fund(Base, TimestampMixin):
    __tablename__ = "fund"

    id: Mapped[PyUUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    representative_user_id: Mapped[PyUUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("app_user.id"),
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
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    fund: Mapped[Fund] = relationship(back_populates="tasks")
    applications: Mapped[list["TaskApplication"]] = relationship(back_populates="task")


class TaskApplication(Base, TimestampMixin):
    __tablename__ = "task_application"

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
