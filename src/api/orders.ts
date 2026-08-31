import { apiClient } from "./client";
import {
  ApiResponse,
  OrderHistoryRow,
  OrderTrackingRow,
  PlaceOrderResult,
} from "@/types";

// Maps to tag "Orders" (customer-facing subset).

export interface PlaceOrderItem {
  productId?: number;
  menuItemId?: number;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderPayload {
  storeId: number;
  flatId: number;
  couponId?: number | null;
  paymentMode: "upi" | "card" | "netbanking" | "wallet" | "cod";
  deliveryInstructions?: string;
  deliveryFee: number;
  platformFee: number;
  discountAmount: number;
  items: PlaceOrderItem[];
}

export async function placeOrder(payload: PlaceOrderPayload) {
  const res = await apiClient.post<ApiResponse<PlaceOrderResult>>(
    "/api/customer/orders",
    payload
  );
  return res.data;
}

export async function submitPaymentCallback(params: {
  orderId: number;
  gateway: string;
  gatewayRefId: string;
  amount: number;
  status: "success" | "failed" | string;
}) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    "/api/customer/orders/payment-callback",
    params
  );
  return res.data;
}

export async function respondToSubstitution(
  orderItemId: number,
  approve: boolean
) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    "/api/customer/orders/substitution/respond",
    { orderItemId, approve }
  );
  return res.data;
}

export async function cancelOrder(orderId: number, reason?: string) {
  const res = await apiClient.post<ApiResponse<unknown>>(
    `/api/customer/orders/${orderId}/cancel`,
    { reason }
  );
  return res.data;
}

export async function fetchOrderTracking(orderId: number) {
  const res = await apiClient.get<ApiResponse<OrderTrackingRow[]>>(
    `/api/customer/orders/${orderId}/tracking`
  );
  return res.data;
}

export async function fetchOrderHistory() {
  const res = await apiClient.get<ApiResponse<OrderHistoryRow[]>>(
    "/api/customer/orders/history"
  );
  return res.data;
}
