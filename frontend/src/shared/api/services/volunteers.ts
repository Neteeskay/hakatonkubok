import { apiClient } from "@/shared/api/client";
import type {
  NotificationResponse,
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
  VolunteerProfileUpdateRequest
} from "@/shared/api/types";

export async function updateMyVolunteerProfile(payload: VolunteerProfileUpdateRequest) {
  return apiClient.patch<UserResponse, VolunteerProfileUpdateRequest>("/volunteers/me", payload);
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

export async function downloadMyVolunteerStatistics(year?: number) {
  return apiClient.requestBlob({
    path: "/volunteers/me/statistics.pdf",
    query: year ? { year } : undefined
  });
}

export const volunteersService = {
  downloadMyVolunteerStatistics,
  getMyVolunteerAchievements,
  getMyVolunteerAchievementsOverview,
  getMyVolunteerHoursByCategory,
  getMyVolunteerHoursDynamics,
  getMyVolunteerHoursLedger,
  getMyVolunteerHoursSummary,
  getPublicVolunteerProfile,
  getMyVolunteerNotifications,
  getMyVolunteerHistory,
  markMyNotificationRead,
  updateMyVolunteerProfile
};
