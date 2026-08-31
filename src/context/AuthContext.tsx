import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { secureStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/constants/config";
import {
  fetchCurrentUser,
  logout as apiLogout,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
} from "@/api/auth";
import { registerAuthExpiredHandler } from "@/api/client";
import { CurrentUser } from "@/types";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  currentUser: CurrentUser | null;
  requestOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  markProfileComplete: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const hydrate = useCallback(async () => {
    setIsLoading(true);
    const token = await secureStorage.get(STORAGE_KEYS.accessToken);
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetchCurrentUser();
      setCurrentUser(res.data);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    registerAuthExpiredHandler(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
    });
    hydrate();
  }, [hydrate]);

  const requestOtp = useCallback(async (mobile: string) => {
    await apiRequestOtp(mobile);
  }, []);

  const verifyOtp = useCallback(async (mobile: string, otp: string) => {
    const res = await apiVerifyOtp(mobile, otp);
    const data = res.data;
    await secureStorage.set(STORAGE_KEYS.accessToken, data.accessToken);
    await secureStorage.set(STORAGE_KEYS.refreshToken, data.refreshToken);
    await secureStorage.set(
      STORAGE_KEYS.accessTokenExpiresAt,
      data.accessTokenExpiresAt
    );
    await secureStorage.set(STORAGE_KEYS.userType, data.userType);
    setIsAuthenticated(true);
    setIsNewUser(data.isNewUser);

    try {
      const me = await fetchCurrentUser();
      setCurrentUser(me.data);
    } catch {
      // Non-fatal: profile-completion screen will fetch again if needed.
    }
    return { isNewUser: data.isNewUser };
  }, []);

  const markProfileComplete = useCallback(() => {
    setIsNewUser(false);
    hydrate();
  }, [hydrate]);

  const logout = useCallback(async () => {
    const refreshTokenValue = await secureStorage.get(
      STORAGE_KEYS.refreshToken
    );
    try {
      if (refreshTokenValue) await apiLogout(refreshTokenValue);
    } catch {
      // Best-effort — proceed with local sign-out regardless.
    }
    await secureStorage.remove(STORAGE_KEYS.accessToken);
    await secureStorage.remove(STORAGE_KEYS.refreshToken);
    await secureStorage.remove(STORAGE_KEYS.accessTokenExpiresAt);
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      isNewUser,
      currentUser,
      requestOtp,
      verifyOtp,
      logout,
      markProfileComplete,
    }),
    [isLoading, isAuthenticated, isNewUser, currentUser, requestOtp, verifyOtp, logout, markProfileComplete]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
