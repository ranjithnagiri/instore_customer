import Constants from "expo-constants";

// Base URL comes from app.json -> expo.extra.apiBaseUrl so it can be
// swapped per environment (dev/staging/prod) without touching code.
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
  "https://testapi.godpixels.com";

// --- Business rules pulled straight from the PRD (section 3) so the UI
// enforces the same policy the backend is expected to enforce. ---
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export const CHECKOUT_RESERVATION_SECONDS = 10 * 60; // 10 minutes
export const SUBSTITUTION_DECISION_SECONDS = 15 * 60; // 15 minutes

export const ACCESS_TOKEN_TTL_MINUTES = 30;
export const REFRESH_TOKEN_TTL_DAYS = 30;

export const ORDER_TRACKING_POLL_MS = 15000;
export const ORDER_QUEUE_POLL_MS = 20000;

export const STORAGE_KEYS = {
  accessToken: "auth.accessToken",
  refreshToken: "auth.refreshToken",
  accessTokenExpiresAt: "auth.accessTokenExpiresAt",
  userType: "auth.userType",
  cart: "cart.state",
  wishlist: "wishlist.items",
  notificationPrefs: "profile.notificationPrefs",
} as const;
