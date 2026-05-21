import { apiClient } from "@/shared/api/client";
import type {
  NotificationResponse,
  NotificationReadCount,
  PublicVolunteerProfileResponse,
  Uuid,
  UserResponse,
  VolunteerAchievementsOverviewResponse,
  VolunteerAchievementResponse,
  VolunteerHoursByCategoryItemResponse,
  VolunteerHoursDynamicsItemResponse,
  VolunteerHoursLedgerItemResponse,
  VolunteerHoursSummaryResponse,
  VolunteerHistoryItemResponse,
  VolunteerProfileResponse,
  VolunteerProfileUpdateRequest
} from "@/shared/api/types";

export const PROFILE_CHANGED_EVENT = "platform-profile-changed";

export function emitProfileChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  }
}

export async function updateMyVolunteerProfile(payload: VolunteerProfileUpdateRequest) {
  const response = await apiClient.patch<UserResponse, VolunteerProfileUpdateRequest>("/volunteers/me", payload);
  emitProfileChanged();
  return response;
}

export async function getMyVolunteerProfile() {
  return apiClient.get<VolunteerProfileResponse>("/volunteers/me/profile");
}

export async function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{ avatar_url: string }, FormData>("/volunteers/me/avatar", formData);
  emitProfileChanged();
  return response;
}

export async function getMyVolunteerHistory(params?: { limit?: number; offset?: number }) {
  return apiClient.get<VolunteerHistoryItemResponse[]>("/volunteers/me/history", {
    query: params
  });
}

export async function getPublicVolunteerProfile(volunteerId: Uuid) {
  return apiClient.get<PublicVolunteerProfileResponse>(`/volunteers/${volunteerId}/public`, { auth: false });
}

export async function getMyVolunteerNotifications(params?: { limit?: number; offset?: number; unread_only?: boolean }) {
  return apiClient.get<NotificationResponse[]>("/volunteers/me/notifications", {
    query: params
  });
}

export async function getMyVolunteerHoursSummary() {
  return apiClient.get<VolunteerHoursSummaryResponse>("/volunteers/me/hours/summary");
}

export async function getMyVolunteerHoursLedger(params?: { limit?: number; offset?: number }) {
  return apiClient.get<VolunteerHoursLedgerItemResponse[]>("/volunteers/me/hours/ledger", {
    query: params
  });
}

export async function getMyVolunteerHoursDynamics() {
  return apiClient.get<VolunteerHoursDynamicsItemResponse[]>("/volunteers/me/hours/dynamics");
}

export async function getMyVolunteerHoursByCategory() {
  return apiClient.get<VolunteerHoursByCategoryItemResponse[]>("/volunteers/me/hours/by-category");
}

export async function getMyVolunteerAchievements() {
  return apiClient.get<VolunteerAchievementResponse[]>("/volunteers/me/achievements");
}

export async function getMyVolunteerAchievementsOverview() {
  return apiClient.get<VolunteerAchievementsOverviewResponse>("/volunteers/me/achievements/overview");
}

export async function markMyNotificationRead(notificationId: Uuid) {
  return apiClient.patch<NotificationResponse, undefined>(`/volunteers/me/notifications/${notificationId}/read`, undefined);
}

export async function markAllMyVolunteerNotificationsRead() {
  return apiClient.patch<NotificationReadCount, Record<string, never>>("/volunteers/me/notifications/read-all", {});
}

export async function downloadMyVolunteerStatistics(year?: number) {
  return apiClient.requestBlob({
    path: "/volunteers/me/statistics.pdf",
    query: year ? { year } : undefined
  });
}

export const volunteersService = {
  downloadMyVolunteerStatistics,
  emitProfileChanged,
  getMyVolunteerAchievements,
  getMyVolunteerAchievementsOverview,
  getMyVolunteerProfile,
  getMyVolunteerHoursByCategory,
  getMyVolunteerHoursDynamics,
  getMyVolunteerHoursLedger,
  getMyVolunteerHoursSummary,
  getPublicVolunteerProfile,
  getMyVolunteerNotifications,
  getMyVolunteerHistory,
  markAllMyVolunteerNotificationsRead,
  markMyNotificationRead,
  updateMyVolunteerProfile,
  uploadMyAvatar
};
