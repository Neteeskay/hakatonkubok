import { apiClient } from "@/shared/api/client";
import type {
  AdminCompletionItemResponse,
  AdminDashboardSummary,
  AdminAwardHoursRequest,
  AdminFundDetailResponse,
  AdminFundListItemResponse,
  AdminFundModerationRequest,
  AdminNotificationReadCount,
  AdminHourLedgerResponse,
  AdminTaskDetailResponse,
  AdminTaskDirectoryItemResponse,
  AdminTaskModerationRequest,
  AdminVolunteerDirectoryItemResponse,
  NotificationResponse,
  FundStatus,
  TaskStatus,
  Uuid
} from "@/shared/api/types";

export async function getAdminDashboard() {
  return apiClient.get<AdminDashboardSummary>("/admin/dashboard");
}

export async function getAdminNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
  return apiClient.get<NotificationResponse[]>("/admin/notifications", {
    query: {
      limit: params?.limit,
      offset: params?.offset,
      unread_only: params?.unreadOnly
    }
  });
}

export async function markAdminNotificationRead(notificationId: Uuid) {
  return apiClient.patch<NotificationResponse, Record<string, never>>(`/admin/notifications/${notificationId}/read`, {});
}

export async function markAllAdminNotificationsRead() {
  return apiClient.patch<AdminNotificationReadCount, Record<string, never>>("/admin/notifications/read-all", {});
}

export async function getPendingAdminFunds(limit = 5) {
  return apiClient.get<AdminFundListItemResponse[]>("/admin/funds/pending", {
    query: { limit, offset: 0 }
  });
}

export async function getAdminFunds(params?: { status?: FundStatus; search?: string; limit?: number; offset?: number }) {
  return apiClient.get<AdminFundListItemResponse[]>("/admin/funds", {
    query: {
      status: params?.status,
      search: params?.search,
      limit: params?.limit,
      offset: params?.offset
    }
  });
}

export async function getAdminFund(fundId: Uuid) {
  return apiClient.get<AdminFundDetailResponse>(`/admin/funds/${fundId}`);
}

export async function moderateAdminFund(fundId: Uuid, payload: AdminFundModerationRequest) {
  return apiClient.patch<AdminFundDetailResponse, AdminFundModerationRequest>(`/admin/funds/${fundId}/moderation`, payload);
}

export async function getAdminTaskDirectory(params?: { status?: TaskStatus; limit?: number; offset?: number }) {
  return apiClient.get<AdminTaskDirectoryItemResponse[]>("/admin/directory/tasks", {
    query: {
      status: params?.status,
      limit: params?.limit,
      offset: params?.offset
    }
  });
}

export async function getAdminTask(taskId: Uuid) {
  return apiClient.get<AdminTaskDetailResponse>(`/admin/tasks/${taskId}`);
}

export async function moderateAdminTask(taskId: Uuid, payload: AdminTaskModerationRequest) {
  return apiClient.patch<AdminTaskDetailResponse, AdminTaskModerationRequest>(`/admin/tasks/${taskId}/moderation`, payload);
}

export async function getAdminCompletionsWaitingHours(limit = 5) {
  return apiClient.get<AdminCompletionItemResponse[]>("/admin/completions/waiting-hours", {
    query: { limit, offset: 0 }
  });
}

export async function awardAdminHours(applicationId: Uuid, payload: AdminAwardHoursRequest) {
  return apiClient.post<AdminHourLedgerResponse, AdminAwardHoursRequest>(`/admin/applications/${applicationId}/award-hours`, payload);
}

export async function getAdminVolunteers(params?: { search?: string; limit?: number; offset?: number }) {
  return apiClient.get<AdminVolunteerDirectoryItemResponse[]>("/admin/volunteers", {
    query: {
      search: params?.search,
      limit: params?.limit,
      offset: params?.offset
    }
  });
}

export const adminService = {
  awardAdminHours,
  getAdminCompletionsWaitingHours,
  getAdminDashboard,
  getAdminFund,
  getAdminFunds,
  getAdminNotifications,
  getAdminTask,
  getAdminTaskDirectory,
  getAdminVolunteers,
  getPendingAdminFunds,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  moderateAdminFund,
  moderateAdminTask
};
