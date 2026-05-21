import { apiClient } from "@/shared/api/client";
import { clearStoredTokens, getRefreshToken, setStoredTokens } from "@/shared/api/token-storage";
import type {
  FundRegisterRequest,
  FundRegisterResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  TokenResponse,
  UserResponse,
  VolunteerRegisterRequest,
  VolunteerRegisterResponse
} from "@/shared/api/types";

function persistTokenResponse(response: TokenResponse) {
  setStoredTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type
  });
}

export async function registerVolunteer(payload: VolunteerRegisterRequest) {
  return apiClient.post<VolunteerRegisterResponse, VolunteerRegisterRequest>("/auth/register/volunteer", payload, { auth: false });
}

export async function registerFund(payload: FundRegisterRequest) {
  return apiClient.post<FundRegisterResponse, FundRegisterRequest>("/auth/register/fund", payload, { auth: false });
}

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<TokenResponse, LoginRequest>("/auth/login", payload, { auth: false });
  persistTokenResponse(response);
  return response;
}

export async function refreshAuthToken(refreshToken = getRefreshToken()) {
  if (!refreshToken) {
    throw new Error("Refresh token is missing");
  }

  const response = await apiClient.post<TokenResponse, RefreshTokenRequest>(
    "/auth/refresh",
    { refresh_token: refreshToken },
    { auth: false }
  );
  persistTokenResponse(response);
  return response;
}

export async function logout(payload?: LogoutRequest) {
  try {
    await apiClient.post<void, LogoutRequest>("/auth/logout", payload ?? { refresh_token: getRefreshToken() });
  } finally {
    clearStoredTokens();
  }
}

export async function getCurrentUser() {
  return apiClient.get<UserResponse>("/auth/me");
}

export const authService = {
  getCurrentUser,
  login,
  logout,
  refreshAuthToken,
  registerFund,
  registerVolunteer
};

