const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const apiConfig = {
  baseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL)
} as const;

