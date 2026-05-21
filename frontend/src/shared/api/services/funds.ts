import { apiClient } from "@/shared/api/client";
import type { FundDashboardSummary, FundDocumentResponse, FundProfileResponse, FundUpdateRequest, Uuid } from "@/shared/api/types";

export async function getMyFundProfile() {
  return apiClient.get<FundProfileResponse>("/funds/me");
}

export async function updateMyFundProfile(payload: FundUpdateRequest) {
  return apiClient.patch<FundProfileResponse, FundUpdateRequest>("/funds/me", payload);
}

export async function getMyFundDashboard() {
  return apiClient.get<FundDashboardSummary>("/funds/me/dashboard");
}

export async function uploadMyFundDocument(payload: { documentType: string; file: File }) {
  const formData = new FormData();
  formData.append("document_type", payload.documentType);
  formData.append("file", payload.file);

  return apiClient.post<FundDocumentResponse, FormData>("/funds/me/documents", formData);
}

export async function getFundProfile(fundId: Uuid) {
  return apiClient.get<FundProfileResponse>(`/funds/${fundId}`);
}

export const fundsService = {
  getFundProfile,
  getMyFundDashboard,
  getMyFundProfile,
  updateMyFundProfile,
  uploadMyFundDocument
};
