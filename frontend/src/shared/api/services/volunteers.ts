import { apiClient } from "@/shared/api/client";
import type {
  UserResponse,
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

export async function downloadMyVolunteerStatistics(year?: number) {
  return apiClient.requestBlob({
    path: "/volunteers/me/statistics.pdf",
    query: year ? { year } : undefined
  });
}

export const volunteersService = {
  downloadMyVolunteerStatistics,
  getMyVolunteerHistory,
  updateMyVolunteerProfile
};

