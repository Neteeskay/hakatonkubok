import { apiClient } from "@/shared/api/client";
import type {
  ApplicationCompletionConfirmRequest,
  ApplicationCreateRequest,
  ApplicationDecisionRequest,
  ApplicationRejectRequest,
  ApplicationResponse,
  ApplicationStatus,
  TaskCompletionsConfirmRequest,
  Uuid
} from "@/shared/api/types";

export async function applyToTask(taskId: Uuid, payload: ApplicationCreateRequest = {}) {
  return apiClient.post<ApplicationResponse, ApplicationCreateRequest>(`/applications/tasks/${taskId}`, payload);
}

export async function getMyApplications(status?: ApplicationStatus) {
  return apiClient.get<ApplicationResponse[]>("/applications/my", {
    query: status ? { status } : undefined
  });
}

export async function cancelMyApplication(applicationId: Uuid) {
  return apiClient.post<ApplicationResponse>(`/applications/my/${applicationId}/cancel`);
}

export async function getFundApplications(params?: { status?: ApplicationStatus; task_id?: Uuid }) {
  return apiClient.get<ApplicationResponse[]>("/applications/fund", {
    query: params
  });
}

export async function getFundApplication(applicationId: Uuid) {
  return apiClient.get<ApplicationResponse>(`/applications/fund/${applicationId}`);
}

export async function acceptFundApplication(applicationId: Uuid, payload: ApplicationDecisionRequest = {}) {
  return apiClient.post<ApplicationResponse, ApplicationDecisionRequest>(`/applications/fund/${applicationId}/accept`, payload);
}

export async function rejectFundApplication(applicationId: Uuid, payload: ApplicationRejectRequest) {
  return apiClient.post<ApplicationResponse, ApplicationRejectRequest>(`/applications/fund/${applicationId}/reject`, payload);
}

export async function confirmFundTaskCompletions(taskId: Uuid, payload: TaskCompletionsConfirmRequest = {}) {
  return apiClient.post<ApplicationResponse[], TaskCompletionsConfirmRequest>(
    `/applications/fund/tasks/${taskId}/confirm-completions`,
    payload
  );
}

export async function confirmFundApplicationCompletion(applicationId: Uuid, payload: ApplicationCompletionConfirmRequest = {}) {
  return apiClient.post<ApplicationResponse, ApplicationCompletionConfirmRequest>(
    `/applications/fund/${applicationId}/confirm-completion`,
    payload
  );
}

export const applicationsService = {
  acceptFundApplication,
  applyToTask,
  cancelMyApplication,
  confirmFundApplicationCompletion,
  confirmFundTaskCompletions,
  getFundApplication,
  getFundApplications,
  getMyApplications,
  rejectFundApplication
};

