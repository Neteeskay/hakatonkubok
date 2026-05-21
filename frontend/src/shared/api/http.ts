import { clearStoredSession, getStoredSession, saveStoredSession } from "@/shared/api/auth-storage";
import type { TokenResponse } from "@/shared/api/types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, "");

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

interface RequestConfig {
  url: string;
  init: RequestInit;
  auth: boolean;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

let refreshPromise: Promise<TokenResponse | null> | null = null;

async function authRequestInterceptor(config: RequestConfig): Promise<RequestConfig> {
  if (!config.auth) return config;

  const session = getStoredSession();
  if (!session?.accessToken) return config;

  const headers = new Headers(config.init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  config.init.headers = headers;
  return config;
}

async function jsonRequestInterceptor(config: RequestConfig): Promise<RequestConfig> {
  const headers = new Headers(config.init.headers);
  const body = config.init.body;

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  config.init.headers = headers;
  return config;
}

const requestInterceptors = [jsonRequestInterceptor, authRequestInterceptor];

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  const retry = options.retry ?? true;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const { auth: _auth, retry: _retry, ...initOptions } = options;
  let config: RequestConfig = {
    url,
    auth,
    init: {
      ...initOptions,
      headers: initOptions.headers
    }
  };

  for (const interceptor of requestInterceptors) {
    config = await interceptor(config);
  }

  try {
    const response = await fetch(config.url, config.init);
    return await handleResponse<T>(response, config, retry);
  } catch (error) {
    if (retry && isRetryableNetworkError(error)) {
      const response = await fetch(config.url, config.init);
      return handleResponse<T>(response, config, false);
    }
    throw error;
  }
}

async function handleResponse<T>(response: Response, config: RequestConfig, retry: boolean): Promise<T> {
  if (response.status === 401 && config.auth && retry) {
    const refreshed = await refreshStoredSession();
    if (refreshed) {
      const headers = new Headers(config.init.headers);
      headers.set("Authorization", `Bearer ${refreshed.access_token}`);
      const retryResponse = await fetch(config.url, { ...config.init, headers });
      return handleResponse<T>(retryResponse, config, false);
    }
  }

  if ((response.status >= 500 || response.status === 429) && retry && isSafeMethod(config.init.method)) {
    const retryResponse = await fetch(config.url, config.init);
    return handleResponse<T>(retryResponse, config, false);
  }

  if (!response.ok) {
    const detail = await readResponseBody(response);
    throw new ApiError(extractErrorMessage(detail, response.statusText), response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function refreshStoredSession(): Promise<TokenResponse | null> {
  if (refreshPromise) return refreshPromise;

  const session = getStoredSession();
  if (!session?.refreshToken) {
    clearStoredSession();
    return null;
  }

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken })
  })
    .then(async (response) => {
      if (!response.ok) {
        clearStoredSession();
        return null;
      }
      const refreshed = (await response.json()) as TokenResponse;
      saveStoredSession({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        user: refreshed.user
      });
      return refreshed;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function extractErrorMessage(detail: unknown, fallback: string) {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object" && "detail" in detail) {
    const value = (detail as { detail?: unknown }).detail;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map((item) => item?.msg ?? "validation error").join("; ");
  }
  return fallback || "Request failed";
}

function isRetryableNetworkError(error: unknown) {
  return error instanceof TypeError;
}

function isSafeMethod(method: string | undefined) {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

export function fileUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}/${path.replace(/^\//, "")}`;
}
