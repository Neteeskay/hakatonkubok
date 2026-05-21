export interface ApiValidationError {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  detail?: string | ApiValidationError[] | Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly method: string;
  readonly payload: ApiErrorPayload | null;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;

  constructor({
    message,
    method,
    payload,
    status,
    statusText,
    url
  }: {
    message: string;
    method: string;
    payload: ApiErrorPayload | null;
    status: number;
    statusText: string;
    url: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.method = method;
    this.payload = payload;
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось выполнить запрос. Попробуйте позже.";
}

export function getApiPayloadMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    return payload.detail.map((item) => item.msg).join("; ");
  }

  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }

  return fallback;
}

