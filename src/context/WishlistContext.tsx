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
import { WishlistItem } from "@/types";

// NOTE: The provided OpenAPI spec has no dedicated wishlist/favorites
// endpoints, so this is implemented as on-device persisted state
// (see README "Known gaps vs. spec"). Swap this for API calls once a
// `/api/customer/wishlist` resource exists server-side.

interface WishlistContextValue {
  items: WishlistItem[];
  isSaved: (key: string) => boolean;
  toggle: (item: WishlistItem) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    appStorage.getJSON<WishlistItem[]>(STORAGE_KEYS.wishlist).then((saved) => {
      if (saved) setItems(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) appStorage.setJSON(STORAGE_KEYS.wishlist, items);
  }, [items, hydrated]);

  const isSaved = useCallback(
    (key: string) => items.some((i) => i.key === key),
    [items]
  );

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) =>
      prev.some((i) => i.key === item.key)
        ? prev.filter((i) => i.key !== item.key)
        : [...prev, item]
    );
  }, []);

  const value = useMemo(() => ({ items, isSaved, toggle }), [items, isSaved, toggle]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
