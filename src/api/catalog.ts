import { apiClient } from "./client";
import { ApiResponse, MenuItem, Product, Store, StoreCategory } from "@/types";

// Maps to tag "Catalog" — stores/products/menu scoped to the resident's
// community (§2.3 "Users can view only stores assigned to their community").

export async function fetchStoresForCommunity(communityId: number) {
  const res = await apiClient.get<ApiResponse<Store[]>>(
    "/api/customer/catalog/stores",
    { params: { communityId } }
  );
  return res.data;
}

export async function fetchStoreProducts(storeId: number) {
  const res = await apiClient.get<ApiResponse<Product[]>>(
    `/api/customer/catalog/stores/${storeId}/products`
  );
  return res.data;
}

export async function fetchStoreMenu(storeId: number) {
  const res = await apiClient.get<ApiResponse<MenuItem[]>>(
    `/api/customer/catalog/stores/${storeId}/menu`
  );
  return res.data;
}

export async function fetchStoreCategories() {
  const res = await apiClient.get<ApiResponse<StoreCategory[]>>(
    "/api/admin/stores/categories"
  );
  return res.data;
}
