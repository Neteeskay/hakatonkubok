"use client";

import { create } from "zustand";
import { clearStoredSession, getStoredSession, saveStoredSession } from "@/shared/api/auth-storage";
import { authApi } from "@/shared/api/services";
import type { ApiUser, FundRegisterRequest, VolunteerRegisterRequest } from "@/shared/api/types";

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (payload: { login: string; password: string }) => Promise<ApiUser>;
  registerVolunteer: (payload: VolunteerRegisterRequest) => Promise<ApiUser>;
  registerFund: (payload: FundRegisterRequest) => Promise<ApiUser>;
  logout: () => Promise<void>;
  syncFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
  hydrate: async () => {
    const stored = getStoredSession();
    if (!stored?.accessToken) {
      set({ status: "anonymous", user: null, accessToken: null, refreshToken: null });
      return;
    }

    set({
      status: "loading",
      user: stored.user,
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      error: null
    });

    try {
      const user = await authApi.me();
      saveStoredSession({ ...stored, user });
      set({ user, status: "authenticated", error: null });
    } catch (error) {
      clearStoredSession();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        status: "anonymous",
        error: error instanceof Error ? error.message : "Auth failed"
      });
    }
  },
  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const response = await authApi.login(payload);
      saveStoredSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user
      });
      set({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        status: "authenticated",
        error: null
      });
      return response.user;
    } catch (error) {
      set({ status: "anonymous", error: error instanceof Error ? error.message : "Login failed" });
      throw error;
    }
  },
  registerVolunteer: async (payload) => {
    await authApi.registerVolunteer(payload);
    return get().login({ login: payload.email, password: payload.password });
  },
  registerFund: async (payload) => {
    await authApi.registerFund(payload);
    return get().login({ login: payload.email, password: payload.password });
  },
  logout: async () => {
    const refreshToken = get().refreshToken;
    try {
      if (get().accessToken) await authApi.logout(refreshToken);
    } finally {
      clearStoredSession();
      set({ user: null, accessToken: null, refreshToken: null, status: "anonymous", error: null });
    }
  },
  syncFromStorage: () => {
    const stored = getStoredSession();
    set({
      user: stored?.user ?? null,
      accessToken: stored?.accessToken ?? null,
      refreshToken: stored?.refreshToken ?? null,
      status: stored?.accessToken ? "authenticated" : "anonymous"
    });
  }
}));

export function routeForRole(role: ApiUser["role"]) {
  if (role === "fund") return "/foundation";
  if (role === "admin") return "/admin";
  return "/volunteer";
}
