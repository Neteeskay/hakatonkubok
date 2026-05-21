import { apiClient, type QueryParams } from "@/shared/api/client";
import type {
  HelpCategoryResponse,
  SkillOptionResponse,
  TaskCreateRequest,
  TaskFeedQuery,
  TaskFilterOptionsResponse,
  TaskResponse,
  TaskStatus,
  TaskUpdateRequest,
  Uuid
} from "@/shared/api/types";

function toTaskFeedQuery(query?: TaskFeedQuery): QueryParams | undefined {
  return query as QueryParams | undefined;
}

export async function getTaskFeed(query?: TaskFeedQuery) {
  return apiClient.get<TaskResponse[]>("/tasks/feed", { query: toTaskFeedQuery(query) });
}

export async function getTaskCategories() {
  return apiClient.get<HelpCategoryResponse[]>("/tasks/categories");
}

export async function getTaskSkills() {
  return apiClient.get<SkillOptionResponse[]>("/tasks/skills");
}

export async function getTaskFilters() {
  return apiClient.get<TaskFilterOptionsResponse>("/tasks/filters");
}

export async function getTask(taskId: Uuid) {
  return apiClient.get<TaskResponse>(`/tasks/${taskId}`);
}

export async function createTask(payload: TaskCreateRequest) {
  return apiClient.post<TaskResponse, TaskCreateRequest>("/tasks", payload);
}

export async function uploadMyTaskImage(taskId: Uuid, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<{ image_url: string }, FormData>(`/tasks/my/${taskId}/image`, formData);
}

export async function getMyTasks(status?: TaskStatus) {
  return apiClient.get<TaskResponse[]>("/tasks/my", {
    query: status ? { status } : undefined
  });
}

export async function getMyTask(taskId: Uuid) {
  return apiClient.get<TaskResponse>(`/tasks/my/${taskId}`);
}

export async function updateMyTask(taskId: Uuid, payload: TaskUpdateRequest) {
  return apiClient.patch<TaskResponse, TaskUpdateRequest>(`/tasks/my/${taskId}`, payload);
}

export async function submitMyTask(taskId: Uuid) {
  return apiClient.post<TaskResponse>(`/tasks/my/${taskId}/submit`);
}

export async function closeMyTask(taskId: Uuid) {
  return apiClient.post<TaskResponse>(`/tasks/my/${taskId}/close`);
}

export const tasksService = {
  closeMyTask,
  createTask,
  getTaskCategories,
  getTaskFilters,
  getTaskSkills,
  getMyTask,
  getMyTasks,
  getTask,
  getTaskFeed,
  submitMyTask,
  uploadMyTaskImage,
  updateMyTask
};
