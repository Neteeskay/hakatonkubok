export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
}

const STORAGE_KEY = "stoloto-volunteer.auth";

let memoryTokens: AuthTokens | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeTokens(value: unknown): AuthTokens | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const tokens = value as Partial<AuthTokens>;
  if (!tokens.accessToken) {
    return null;
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
    tokenType: tokens.tokenType ?? "bearer"
  };
}

export function getStoredTokens() {
  if (memoryTokens) {
    return memoryTokens;
  }

  if (!canUseStorage()) {
    return null;
  }

  try {
    memoryTokens = normalizeTokens(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    memoryTokens = null;
  }

  return memoryTokens;
}

export function setStoredTokens(tokens: AuthTokens) {
  memoryTokens = normalizeTokens(tokens);

  if (!canUseStorage() || !memoryTokens) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryTokens));
}

export function clearStoredTokens() {
  memoryTokens = null;

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken() {
  return getStoredTokens()?.accessToken ?? null;
}

export function getRefreshToken() {
  return getStoredTokens()?.refreshToken ?? null;
}

