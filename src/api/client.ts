import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "@/constants/config";
import { secureStorage } from "@/utils/storage";
import { ApiResponse, AuthResult } from "@/types";

// Endpoints that must NOT get an Authorization header and must never
// trigger the refresh-on-401 flow (they ARE the auth endpoints).
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/otp/request",
  "/api/auth/otp/verify",
  "/api/auth/refresh",
];

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// AuthContext registers this so the client can force a sign-out /
// navigate to Login when a refresh ultimately fails.
let onAuthExpired: (() => void) | null = null;
export function registerAuthExpiredHandler(handler: () => void) {
  onAuthExpired = handler;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const path = config.url || "";
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return config;

  const token = await secureStorage.get(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A single in-flight refresh promise shared by every 401 that arrives
// while a refresh is already underway, so we never fire two
// /api/auth/refresh calls back to back.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  try {
    const res = await axios.post<ApiResponse<AuthResult>>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken }
    );
    const data = res.data.data;
    if (!data?.accessToken) return null;

    await secureStorage.set(STORAGE_KEYS.accessToken, data.accessToken);
    await secureStorage.set(STORAGE_KEYS.refreshToken, data.refreshToken);
    await secureStorage.set(
      STORAGE_KEYS.accessTokenExpiresAt,
      data.accessTokenExpiresAt
    );
    return data.accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const path = original?.url || "";
    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

    if (error.response?.status !== 401 || !original || original._retry || isPublic) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (!newToken) {
      await secureStorage.remove(STORAGE_KEYS.accessToken);
      await secureStorage.remove(STORAGE_KEYS.refreshToken);
      onAuthExpired?.();
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  }
);
