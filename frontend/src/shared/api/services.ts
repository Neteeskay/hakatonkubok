import { apiFetch } from "@/shared/api/http";
import type {
  ApiAchievement,
  ApiAdminDashboard,
  ApiAdminApplication,
  ApiAdminCompletion,
  ApiAdminFund,
  ApiAdminFundDetail,
  ApiAdminTask,
  ApiAdminTaskDetail,
  ApiApplication,
  ApiApplicationStatus,
  ApiFundProfile,
  ApiFundStatus,
  ApiTask,
  ApiTaskStatus,
  ApiUser,
  ApiVolunteerHistoryItem,
  FundRegisterRequest,
  FundRegisterResponse,
  TaskCreateRequest,
  TokenResponse,
  VolunteerRegisterRequest,
  VolunteerRegisterResponse
} from "@/shared/api/types";

export const authApi = {
  login(payload: { login: string; password: string }) {
    return apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });
  },
  me() {
    return apiFetch<ApiUser>("/auth/me");
  },
  refresh(refreshToken: string) {
    return apiFetch<TokenResponse>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  },
  logout(refreshToken: string | null) {
    return apiFetch<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  },
  registerVolunteer(payload: VolunteerRegisterRequest) {
    return apiFetch<VolunteerRegisterResponse>("/auth/register/volunteer", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });
  },
  registerFund(payload: FundRegisterRequest) {
    return apiFetch<FundRegisterResponse>("/auth/register/fund", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });
  }
};

export const fundApi = {
  me() {
    return apiFetch<ApiFundProfile>("/funds/me");
  },
  getById(fundId: string) {
    return apiFetch<ApiFundProfile>(`/funds/${fundId}`);
  },
  updateMe(payload: Partial<ApiFundProfile>) {
    return apiFetch<ApiFundProfile>("/funds/me", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  uploadDocument(payload: { documentType: string; file: File }) {
    const formData = new FormData();
    formData.append("document_type", payload.documentType);
    formData.append("file", payload.file);

    return apiFetch<ApiFundProfile["documents"][number]>("/funds/me/documents", {
      method: "POST",
      body: formData
    });
  }
};

export const taskApi = {
  listFeed(params?: {
    search?: string;
    city?: string;
    category?: string;
    format?: string;
    duration?: string;
    type?: string;
    required_skill?: string;
    sort?: string;
  }) {
    const search = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const query = search.toString();
    return apiFetch<ApiTask[]>(`/tasks/feed${query ? `?${query}` : ""}`);
  },
  get(taskId: string) {
    return apiFetch<ApiTask>(`/tasks/${taskId}`);
  },
  listMine(status?: ApiTaskStatus) {
    return apiFetch<ApiTask[]>(`/tasks/my${status ? `?status=${status}` : ""}`);
  },
  create(payload: TaskCreateRequest) {
    return apiFetch<ApiTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  submit(taskId: string) {
    return apiFetch<ApiTask>(`/tasks/my/${taskId}/submit`, { method: "POST" });
  },
  close(taskId: string) {
    return apiFetch<ApiTask>(`/tasks/my/${taskId}/close`, { method: "POST" });
  }
};

export const applicationApi = {
  apply(taskId: string, volunteerComment?: string | null) {
    return apiFetch<ApiApplication>(`/applications/tasks/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ volunteer_comment: volunteerComment ?? null })
    });
  },
  listMine(status?: ApiApplicationStatus) {
    return apiFetch<ApiApplication[]>(`/applications/my${status ? `?status=${status}` : ""}`);
  },
  cancel(applicationId: string) {
    return apiFetch<ApiApplication>(`/applications/my/${applicationId}/cancel`, { method: "POST" });
  },
  listFund(params?: { taskId?: string; status?: ApiApplicationStatus }) {
    const search = new URLSearchParams();
    if (params?.taskId) search.set("task_id", params.taskId);
    if (params?.status) search.set("status", params.status);
    const query = search.toString();
    return apiFetch<ApiApplication[]>(`/applications/fund${query ? `?${query}` : ""}`);
  },
  accept(applicationId: string, fundComment?: string | null) {
    return apiFetch<ApiApplication>(`/applications/fund/${applicationId}/accept`, {
      method: "POST",
      body: JSON.stringify({ fund_comment: fundComment ?? null })
    });
  },
  reject(applicationId: string, fundComment: string) {
    return apiFetch<ApiApplication>(`/applications/fund/${applicationId}/reject`, {
      method: "POST",
      body: JSON.stringify({ fund_comment: fundComment })
    });
  },
  confirmCompletion(applicationId: string, completionComment?: string | null) {
    return apiFetch<ApiApplication>(`/applications/fund/${applicationId}/confirm-completion`, {
      method: "POST",
      body: JSON.stringify({ completion_comment: completionComment ?? null })
    });
  },
  confirmTaskCompletions(taskId: string, completionComment?: string | null) {
    return apiFetch<ApiApplication[]>(`/applications/fund/tasks/${taskId}/confirm-completions`, {
      method: "POST",
      body: JSON.stringify({ completion_comment: completionComment ?? null })
    });
  }
};

export const volunteerApi = {
  history() {
    return apiFetch<ApiVolunteerHistoryItem[]>("/volunteers/me/history");
  },
  achievements() {
    return apiFetch<ApiAchievement[]>("/volunteers/me/achievements");
  }
};

export const adminApi = {
  dashboard() {
    return apiFetch<ApiAdminDashboard>("/admin/dashboard");
  },
  funds(status?: ApiFundStatus) {
    return apiFetch<ApiAdminFund[]>(`/admin/funds${status ? `?status=${status}` : ""}`);
  },
  tasks(status?: ApiTaskStatus) {
    return apiFetch<ApiAdminTask[]>(`/admin/tasks${status ? `?status=${status}` : ""}`);
  },
  applications(status?: ApiApplicationStatus) {
    return apiFetch<ApiAdminApplication[]>(`/admin/applications${status ? `?status=${status}` : ""}`);
  },
  waitingHours() {
    return apiFetch<ApiAdminCompletion[]>("/admin/completions/waiting-hours");
  },
  moderateFund(fundId: string, targetStatus: ApiFundStatus, comment?: string | null) {
    return apiFetch<ApiAdminFundDetail>(`/admin/funds/${fundId}/moderation`, {
      method: "PATCH",
      body: JSON.stringify({ target_status: targetStatus, comment: comment ?? null })
    });
  },
  moderateTask(taskId: string, targetStatus: ApiTaskStatus, comment?: string | null) {
    return apiFetch<ApiAdminTaskDetail>(`/admin/tasks/${taskId}/moderation`, {
      method: "PATCH",
      body: JSON.stringify({ target_status: targetStatus, comment: comment ?? null })
    });
  },
  awardHours(applicationId: string, hours: number, adminComment?: string | null) {
    return apiFetch(`/admin/applications/${applicationId}/award-hours`, {
      method: "POST",
      body: JSON.stringify({ hours: String(hours), admin_comment: adminComment ?? null })
    });
  }
};
