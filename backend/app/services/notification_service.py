from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Notification, User


class NotificationNotFoundError(Exception):
    pass


async def list_user_notifications(
    session: AsyncSession,
    user: User,
    *,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Notification]:
    statement = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if unread_only:
        statement = statement.where(Notification.is_read.is_(False))

    result = await session.execute(statement)
    return list(result.scalars().all())


async def mark_notification_read(
    session: AsyncSession,
    user: User,
    notification_id: UUID,
) -> Notification:
    notification = await session.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    if notification is None:
        raise NotificationNotFoundError

    notification.is_read = True
    await session.commit()
    await session.refresh(notification)
    return notification


async def mark_all_user_notifications_read(
    session: AsyncSession,
    user: User,
) -> int:
    result = await session.execute(
        update(Notification)
        .where(Notification.user_id == user.id)
        .where(Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await session.commit()
    return int(result.rowcount or 0)
