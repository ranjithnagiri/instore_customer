// Generic wrapper matching every *ApiResponse schema in the spec
export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[] | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  mustResetPassword: boolean;
  userId: number;
  userType: string;
  roles: string[];
  isNewUser: boolean;
}

export interface CurrentUser {
  userId: number;
  userType: string;
  roles: string[];
  communityId?: number | null;
  storeId?: number | null;
  residentId?: number | null;
}

export interface Resident {
  id: number;
  userId: number;
  flatId: number;
  name: string;
  walletBalance: number;
  createdAt: string;
}

export interface Store {
  id: number;
  communityId: number;
  userId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  storeType: "grocery" | "food_stall" | "pharmacy" | "bakery" | "dairy" | string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  storeContact?: string | null;
  operatingHours?: string | null;
  weeklyHolidays?: string | null;
  preparationTimeMin: number;
  deliveryTimeMin: number;
  isOpen: boolean;
  isPaused: boolean;
  status?: string | null;
}

export interface StoreCategory {
  id: number;
  name: string;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
}

export interface Product {
  id: number;
  storeId: number;
  categoryId?: number | null;
  name: string;
  description?: string | null;
  unit?: string | null;
  weight?: string | null;
  mrp: number;
  sellingPrice: number;
  taxPercent: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  storeId: number;
  comboId?: number | null;
  name: string;
  description?: string | null;
  price: number;
  vegFlag?: string | null;
  preparationTimeMin: number;
  isDailySpecial: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
}

export type SubstitutionStatus = "none" | "proposed" | "approved" | "declined";

export interface OrderTrackingRow {
  orderId: number;
  orderNumber: string;
  residentId: number;
  status:
    | "order_placed"
    | "accepted"
    | "preparing"
    | "packed"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refunded"
    | string;
  totalAmount: number;
  placedAt?: string | null;
  acceptedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  storeName?: string | null;
  storeContact?: string | null;
  estimatedDeliveryTime: string;
}

export interface OrderHistoryRow {
  residentId: number;
  orderId: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  placedAt?: string | null;
  deliveredAt?: string | null;
  storeName?: string | null;
  itemCount: number;
  productRating?: number | null;
  storeRating?: number | null;
  deliveryRating?: number | null;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "flat" | "free_delivery" | string;
  value: number;
  communityId?: number | null;
  storeId?: number | null;
  validFrom: string;
  validTo: string;
  minOrderAmount: number;
  isActive: boolean;
}

export interface CouponApplyResult {
  isValid: boolean;
  discountAmount: number;
  errorMessage?: string | null;
}

export interface WalletLedgerRow {
  id: number;
  residentId: number;
  amount: number; // positive = credit, negative = debit
  reasonCode: "refund" | "cashback" | "referral" | "manual_adjustment" | string;
  referenceOrderId?: number | null;
  createdAt: string;
  currentBalance: number;
}

export interface PlaceOrderResult {
  orderId: number;
  orderNumber: string;
}

// --- Client-side only models (no dedicated backend table in the spec) ---

export interface CartItem {
  key: string; // `${storeId}:${productId|menuItemId}`
  storeId: number;
  storeName: string;
  storeType: string;
  productId?: number;
  menuItemId?: number;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface WishlistItem {
  key: string;
  storeId: number;
  productId?: number;
  menuItemId?: number;
  name: string;
  price: number;
  imageUrl?: string | null;
}

export interface NotificationPreferences {
  orderUpdates: true; // mandatory, always true, cannot be disabled
  promotional: boolean;
  festivalOffers: boolean;
}
