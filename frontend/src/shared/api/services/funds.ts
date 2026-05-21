import { apiClient } from "@/shared/api/client";
import type {
  FundDashboardSummary,
  FundDocumentResponse,
  FundProfileResponse,
  FundReportHoursByMonthResponse,
  FundReportParticipantRow,
  FundReportSummaryResponse,
  FundUpdateRequest,
  NotificationReadCount,
  NotificationResponse,
  PublicFundProfileResponse,
  TaskResponse,
  Uuid
} from "@/shared/api/types";

export async function getMyFundProfile() {
  return apiClient.get<FundProfileResponse>("/funds/me");
}

export async function updateMyFundProfile(payload: FundUpdateRequest) {
  return apiClient.patch<FundProfileResponse, FundUpdateRequest>("/funds/me", payload);
}

export async function getMyFundDashboard() {
  return apiClient.get<FundDashboardSummary>("/funds/me/dashboard");
}

export async function getMyFundReportSummary() {
  return apiClient.get<FundReportSummaryResponse>("/funds/me/reports/summary");
}

export async function getMyFundReportParticipants(params?: { limit?: number; offset?: number }) {
  return apiClient.get<FundReportParticipantRow[]>("/funds/me/reports/participants", {
    query: params
  });
}

export async function getMyFundReportHours(params?: { months?: number }) {
  return apiClient.get<FundReportHoursByMonthResponse[]>("/funds/me/reports/hours", {
    query: params
  });
}

export async function getMyFundNotifications(params?: { limit?: number; offset?: number; unread_only?: boolean }) {
  return apiClient.get<NotificationResponse[]>("/funds/me/notifications", {
    query: params
  });
}

export async function markMyFundNotificationRead(notificationId: Uuid) {
  return apiClient.patch<NotificationResponse, undefined>(`/funds/me/notifications/${notificationId}/read`, undefined);
}

export async function markAllMyFundNotificationsRead() {
  return apiClient.patch<NotificationReadCount, Record<string, never>>("/funds/me/notifications/read-all", {});
}

export async function uploadMyFundDocument(payload: { documentType: string; file: File }) {
  const formData = new FormData();
  formData.append("document_type", payload.documentType);
  formData.append("file", payload.file);

  return apiClient.post<FundDocumentResponse, FormData>("/funds/me/documents", formData);
}

export async function downloadMyFundParticipantsReport(format: "csv" | "xlsx") {
  return apiClient.requestBlob({
    path: `/funds/me/reports/participants.${format}`
  });
}

export async function downloadMyFundHoursReport(format: "csv" | "xlsx") {
  return apiClient.requestBlob({
    path: `/funds/me/reports/hours.${format}`
  });
}

export async function uploadMyFundLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<{ file_url: string }, FormData>("/funds/me/logo", formData);
}

export async function uploadMyFundCover(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<{ file_url: string }, FormData>("/funds/me/cover", formData);
}

export async function getFundProfile(fundId: Uuid) {
  return apiClient.get<FundProfileResponse>(`/funds/${fundId}`);
}

export async function getPublicFundProfile(fundId: Uuid) {
  return apiClient.get<PublicFundProfileResponse>(`/funds/${fundId}/public`, { auth: false });
}

export async function listPublicFundTasks(fundId: Uuid) {
  return apiClient.get<TaskResponse[]>(`/funds/${fundId}/tasks`, { auth: false });
}

export const fundsService = {
  downloadMyFundHoursReport,
  downloadMyFundParticipantsReport,
  getFundProfile,
  getMyFundDashboard,
  getMyFundProfile,
  getMyFundNotifications,
  getMyFundReportHours,
  getMyFundReportParticipants,
  getMyFundReportSummary,
  getPublicFundProfile,
  listPublicFundTasks,
  markAllMyFundNotificationsRead,
  markMyFundNotificationRead,
  updateMyFundProfile,
  uploadMyFundCover,
  uploadMyFundDocument,
  uploadMyFundLogo
};
