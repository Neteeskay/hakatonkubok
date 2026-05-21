const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const apiConfig = {
  baseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL)
} as const;

export function resolveApiFileUrl(value?: string | null) {
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("/") && !value.startsWith("/uploads")) {
    return value;
  }

  const apiUrl = new URL(apiConfig.baseUrl);
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${apiUrl.origin}${normalizedPath}`;
}
