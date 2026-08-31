import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { appStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/constants/config";
import { CartItem } from "@/types";

interface AddToCartInput {
  storeId: number;
  storeName: string;
  storeType: string;
  productId?: number;
  menuItemId?: number;
  name: string;
  unitPrice: number;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  storeId: number | null;
  storeName: string | null;
  subtotal: number;
  itemCount: number;
  // Returns a conflict flag instead of throwing so the UI can show the
  // "start a new cart?" prompt required by PRD §3 "One store per cart".
  addItem: (item: AddToCartInput) => { conflict: boolean };
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  replaceCartWithItem: (item: AddToCartInput) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    appStorage.getJSON<CartItem[]>(STORAGE_KEYS.cart).then((saved) => {
      if (saved) setItems(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) appStorage.setJSON(STORAGE_KEYS.cart, items);
  }, [items, hydrated]);

  const storeId = items[0]?.storeId ?? null;
  const storeName = items[0]?.storeName ?? null;

  const keyFor = (i: Pick<AddToCartInput, "storeId" | "productId" | "menuItemId">) =>
    `${i.storeId}:${i.productId ?? "m" + i.menuItemId}`;

  const addItem = useCallback(
    (item: AddToCartInput): { conflict: boolean } => {
      let conflict = false;
      setItems((prev) => {
        if (prev.length > 0 && prev[0].storeId !== item.storeId) {
          // PRD §3 "One store per cart": don't silently merge, surface a
          // conflict so the caller can prompt the resident.
          conflict = true;
          return prev;
        }
        const key = keyFor(item);
        const existing = prev.find((p) => p.key === key);
        if (existing) {
          return prev.map((p) =>
            p.key === key ? { ...p, quantity: p.quantity + 1 } : p
          );
        }
        return [...prev, { ...item, key, quantity: 1 }];
      });
      return { conflict };
    },
    []
  );

  const replaceCartWithItem = useCallback((item: AddToCartInput) => {
    const key = keyFor(item);
    setItems([{ ...item, key, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((p) => p.key !== key);
      return prev.map((p) => (p.key === key ? { ...p, quantity } : p));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      storeId,
      storeName,
      subtotal,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCartWithItem,
    }),
    [items, storeId, storeName, subtotal, itemCount, addItem, removeItem, updateQuantity, clearCart, replaceCartWithItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
