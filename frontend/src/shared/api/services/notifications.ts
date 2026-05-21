import { adminService } from "@/shared/api/services/admin";
import { fundsService } from "@/shared/api/services/funds";
import { volunteersService } from "@/shared/api/services/volunteers";
import type { NotificationResponse, Uuid } from "@/shared/api/types";
import type { AppRole } from "@/shared/config/navigation";

export const NOTIFICATIONS_CHANGED_EVENT = "platform-notifications-changed";

export function emitNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export async function getRoleNotifications(
  role: AppRole,
  params?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<NotificationResponse[]> {
  if (role === "admin") {
    return adminService.getAdminNotifications(params);
  }

  if (role === "foundation") {
    return fundsService.getMyFundNotifications({
      limit: params?.limit,
      offset: params?.offset,
      unread_only: params?.unreadOnly
    });
  }

  return volunteersService.getMyVolunteerNotifications({
    limit: params?.limit,
    offset: params?.offset,
    unread_only: params?.unreadOnly
  });
}

export async function markRoleNotificationRead(role: AppRole, notificationId: Uuid): Promise<NotificationResponse> {
  const notification = role === "admin"
    ? await adminService.markAdminNotificationRead(notificationId)
    : role === "foundation"
      ? await fundsService.markMyFundNotificationRead(notificationId)
      : await volunteersService.markMyNotificationRead(notificationId);

  emitNotificationsChanged();
  return notification;
}

export async function markAllRoleNotificationsRead(role: AppRole) {
  const result = role === "admin"
    ? await adminService.markAllAdminNotificationsRead()
    : role === "foundation"
      ? await fundsService.markAllMyFundNotificationsRead()
      : await volunteersService.markAllMyVolunteerNotificationsRead();

  emitNotificationsChanged();
  return result;
}

export const notificationsService = {
  getRoleNotifications,
  markAllRoleNotificationsRead,
  markRoleNotificationRead
};
