import { apiConfig } from "@/shared/api/config";
import { ApiError, type ApiErrorPayload, getApiPayloadMessage } from "@/shared/api/errors";
import { getAccessToken } from "@/shared/api/token-storage";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface ApiRequestOptions<TBody = unknown> {
  auth?: boolean;
  body?: TBody;
  headers?: HeadersInit;
  method?: HttpMethod;
  path: string;
  query?: QueryParams;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: QueryParams) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = new URL(isAbsolute ? path : `${apiConfig.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        if (item !== null && item !== undefined) {
          url.searchParams.append(key, String(item));
        }
      });
    });
  }

  return url.toString();
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function serializeBody(body: unknown) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isFormDataBody(body)) {
    return body;
  }

  return JSON.stringify(body);
}

async function parseJsonPayload(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text } satisfies ApiErrorPayload;
  }
}

function toApiErrorPayload(payload: unknown): ApiErrorPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as ApiErrorPayload;
}

function createHeaders(body: unknown, headers?: HeadersInit, auth = true) {
  const nextHeaders = new Headers(headers);

  if (body !== undefined && body !== null && !isFormDataBody(body) && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token && !nextHeaders.has("Authorization")) {
      nextHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  return nextHeaders;
}

export async function apiRequest<TResponse, TBody = unknown>({
  auth = true,
  body,
  headers,
  method,
  path,
  query,
  signal
}: ApiRequestOptions<TBody>) {
  const requestMethod = method ?? (body === undefined ? "GET" : "POST");
  const url = buildUrl(path, query);
  const response = await fetch(url, {
    body: serializeBody(body),
    headers: createHeaders(body, headers, auth),
    method: requestMethod,
    signal
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = await parseJsonPayload(response);

  if (!response.ok) {
    const errorPayload = toApiErrorPayload(payload);
    throw new ApiError({
      message: getApiPayloadMessage(errorPayload, response.statusText || "API request failed"),
      method: requestMethod,
      payload: errorPayload,
      status: response.status,
      statusText: response.statusText,
      url
    });
  }

  return payload as TResponse;
}

export async function apiRequestBlob<TBody = unknown>({
  auth = true,
  body,
  headers,
  method,
  path,
  query,
  signal
}: ApiRequestOptions<TBody>) {
  const requestMethod = method ?? (body === undefined ? "GET" : "POST");
  const url = buildUrl(path, query);
  const response = await fetch(url, {
    body: serializeBody(body),
    headers: createHeaders(body, headers, auth),
    method: requestMethod,
    signal
  });

  if (!response.ok) {
    const payload = await parseJsonPayload(response);
    const errorPayload = toApiErrorPayload(payload);
    throw new ApiError({
      message: getApiPayloadMessage(errorPayload, response.statusText || "API request failed"),
      method: requestMethod,
      payload: errorPayload,
      status: response.status,
      statusText: response.statusText,
      url
    });
  }

  return response.blob();
}

export const apiClient = {
  delete: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "path">) =>
    apiRequest<TResponse>({ ...options, method: "DELETE", path }),
  get: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "path">) =>
    apiRequest<TResponse>({ ...options, method: "GET", path }),
  patch: <TResponse, TBody = unknown>(path: string, body: TBody, options?: Omit<ApiRequestOptions<TBody>, "body" | "method" | "path">) =>
    apiRequest<TResponse, TBody>({ ...options, body, method: "PATCH", path }),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "body" | "method" | "path">) =>
    apiRequest<TResponse, TBody>({ ...options, body, method: "POST", path }),
  request: apiRequest,
  requestBlob: apiRequestBlob
};

