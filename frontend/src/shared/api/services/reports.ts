import { apiClient } from "@/shared/api/client";
import type { ParticipantReportRow, PlatformAnalyticsReport } from "@/shared/api/types";

export async function getParticipantsReport(params?: { limit?: number; offset?: number }) {
  return apiClient.get<ParticipantReportRow[]>("/reports/participants", {
    query: params
  });
}

export async function getPlatformAnalyticsReport() {
  return apiClient.get<PlatformAnalyticsReport>("/reports/analytics");
}

export async function downloadParticipantsReport(format: "csv" | "xlsx") {
  return apiClient.requestBlob({
    path: `/reports/participants.${format}`
  });
}

export async function downloadAnalyticsReport(format: "csv" | "xlsx") {
  return apiClient.requestBlob({
    path: `/reports/analytics.${format}`
  });
}

export async function downloadFullPlatformReport() {
  return apiClient.requestBlob({
    path: "/reports/export.xlsx"
  });
}

export const reportsService = {
  downloadAnalyticsReport,
  downloadFullPlatformReport,
  downloadParticipantsReport,
  getParticipantsReport,
  getPlatformAnalyticsReport
};

