import type { ApiUser } from "@/shared/api/types";

const AUTH_STORAGE_KEY = "pomogat_prosto_auth";

export interface StoredSession {
  accessToken: string;
  refreshToken: string | null;
  user: ApiUser | null;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredSession(): StoredSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("auth-session-changed", { detail: session }));
}

export function clearStoredSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth-session-changed"));
}
