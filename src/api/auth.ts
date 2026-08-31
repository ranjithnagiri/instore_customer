import { apiClient } from "./client";
import { ApiResponse, AuthResult, CurrentUser } from "@/types";

// Maps to tag "Auth" in the OpenAPI spec.

export async function requestOtp(mobile: string) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    "/api/auth/otp/request",
    { mobile }
  );
  return res.data;
}

export async function verifyOtp(mobile: string, otp: string) {
  const res = await apiClient.post<ApiResponse<AuthResult>>(
    "/api/auth/otp/verify",
    { mobile, otp }
  );
  return res.data;
}

export async function loginWithPassword(mobile: string, password: string) {
  const res = await apiClient.post<ApiResponse<AuthResult>>(
    "/api/auth/login",
    { mobile, password }
  );
  return res.data;
}

export async function refreshToken(refreshTokenValue: string) {
  const res = await apiClient.post<ApiResponse<AuthResult>>(
    "/api/auth/refresh",
    { refreshToken: refreshTokenValue }
  );
  return res.data;
}

export async function logout(refreshTokenValue: string) {
  const res = await apiClient.post<ApiResponse<unknown>>("/api/auth/logout", {
    refreshToken: refreshTokenValue,
  });
  return res.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    "/api/auth/change-password",
    { currentPassword, newPassword }
  );
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await apiClient.get<ApiResponse<CurrentUser>>("/api/auth/me");
  return res.data;
}
