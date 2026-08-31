import { apiClient } from "./client";
import { ApiResponse, Coupon, CouponApplyResult, Resident, WalletLedgerRow } from "@/types";

// --- Coupons ---
export async function applyCoupon(params: {
  couponCode: string;
  storeId: number;
  orderSubtotal: number;
}) {
  const res = await apiClient.post<ApiResponse<CouponApplyResult>>(
    "/api/customer/coupons/apply",
    params
  );
  return res.data;
}

export async function fetchCoupons(communityId?: number, storeId?: number) {
  const res = await apiClient.get<ApiResponse<Coupon[]>>("/api/admin/coupons", {
    params: { communityId, storeId },
  });
  return res.data;
}

// --- Profile ---
export async function fetchMyProfile() {
  const res = await apiClient.get<ApiResponse<Resident>>(
    "/api/customer/profile/me"
  );
  return res.data;
}

export async function completeProfile(flatId: number, name?: string) {
  const res = await apiClient.post<ApiResponse<number>>(
    "/api/customer/profile/complete",
    { flatId, name }
  );
  return res.data;
}

// --- Reviews ---
export async function submitReview(params: {
  orderId: number;
  productRating?: number;
  storeRating?: number;
  deliveryRating?: number;
  comment?: string;
}) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    "/api/customer/reviews",
    params
  );
  return res.data;
}

// --- Wallet ---
export async function fetchWalletLedger() {
  const res = await apiClient.get<ApiResponse<WalletLedgerRow[]>>(
    "/api/customer/wallet/ledger"
  );
  return res.data;
}

// --- Communities / flats (used during profile completion / signup) ---
export async function fetchCommunities() {
  const res = await apiClient.get<ApiResponse<{ id: number; name: string }[]>>(
    "/api/admin/communities"
  );
  return res.data;
}

export async function fetchBlocksForCommunity(communityId: number) {
  const res = await apiClient.get<ApiResponse<{ id: number; name: string }[]>>(
    `/api/admin/communities/${communityId}/blocks`
  );
  return res.data;
}

export async function fetchFlatsForBlock(blockId: number) {
  const res = await apiClient.get<
    ApiResponse<{ id: number; flatNumber: string }[]>
  >(`/api/admin/communities/blocks/${blockId}/flats`);
  return res.data;
}
