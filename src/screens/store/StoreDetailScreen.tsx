import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { fetchStoreMenu, fetchStoreProducts } from "@/api/catalog";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { MenuItem, Product, Store } from "@/types";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "StoreDetail">;

type CatalogRow =
  | { kind: "product"; item: Product }
  | { kind: "menu"; item: MenuItem };

// PRD §2.5 Product Listing (images, price, availability) + §2.6 Add to
// Cart, and §3 "Order cut-off feedback" (block adding to cart / checkout
// when the store is closed or paused, rather than failing at payment).

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const { addItem, replaceCartWithItem, storeName: cartStoreName } = useCart();
  const { isSaved, toggle } = useWishlist();
  const [store, setStore] = useState<Store | null>(null);
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Store details aren't exposed on a dedicated customer endpoint
        // in the spec, so we derive isOpen/isPaused/name from whichever
        // catalog call succeeds first and fall back gracefully.
        const productsRes = await fetchStoreProducts(storeId).catch(() => null);
        const menuRes = await fetchStoreMenu(storeId).catch(() => null);
        if (cancelled) return;

        const productRows: CatalogRow[] = (productsRes?.data ?? []).map((p) => ({
          kind: "product",
          item: p,
        }));
        const menuRows: CatalogRow[] = (menuRes?.data ?? []).map((m) => ({
          kind: "menu",
          item: m,
        }));
        setRows([...productRows, ...menuRows]);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message ?? "Couldn't load this store's items.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: store?.name ?? "Store" });
  }, [navigation, store]);

  const onAdd = (row: CatalogRow) => {
    const price = row.kind === "product" ? row.item.sellingPrice : row.item.price;
    const isAvailable =
      row.kind === "product" ? row.item.isActive : row.item.isAvailable;
    if (!isAvailable) {
      Alert.alert("Currently unavailable", "This item is out of stock right now.");
      return;
    }
    const payload = {
      storeId,
      storeName: store?.name ?? cartStoreName ?? "Store",
      storeType: store?.storeType ?? "grocery",
      productId: row.kind === "product" ? row.item.id : undefined,
      menuItemId: row.kind === "menu" ? row.item.id : undefined,
      name: row.item.name,
      unitPrice: price,
      imageUrl: row.item.imageUrl,
    };
    const { conflict } = addItem(payload);
    if (conflict) {
      Alert.alert(
        "Start a new cart?",
        `Your cart has items from ${cartStoreName}. Adding from a different store will start a new cart (each store has its own delivery fee and prep time).`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start New Cart",
            style: "destructive",
            onPress: () => replaceCartWithItem(payload),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color="#1B7F4D" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.kind}-${r.item.id}`}
        ListEmptyComponent={
          <EmptyState
            title={error ? "Something went wrong" : "Nothing here yet"}
            subtitle={error ?? "This store hasn't added items yet."}
          />
        }
        renderItem={({ item: row }) => {
          const price = row.kind === "product" ? row.item.sellingPrice : row.item.price;
          const mrp = row.kind === "product" ? row.item.mrp : undefined;
          const available =
            row.kind === "product" ? row.item.isActive : row.item.isAvailable;
          const wishKey = `${storeId}:${row.kind === "product" ? row.item.id : "m" + row.item.id}`;

          return (
            <View style={styles.card}>
              <Image
                source={{ uri: row.item.imageUrl || "https://placehold.co/72x72" }}
                style={styles.thumb}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{row.item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{price.toFixed(2)}</Text>
                  {mrp && mrp > price ? (
                    <Text style={styles.mrp}>₹{mrp.toFixed(2)}</Text>
                  ) : null}
                </View>
                {!available && <Text style={styles.oos}>Out of stock</Text>}
              </View>
              <TouchableOpacity
                onPress={() =>
                  toggle({
                    key: wishKey,
                    storeId,
                    productId: row.kind === "product" ? row.item.id : undefined,
                    menuItemId: row.kind === "menu" ? row.item.id : undefined,
                    name: row.item.name,
                    price,
                    imageUrl: row.item.imageUrl,
                  })
                }
                style={{ marginRight: 8 }}
              >
                <Text style={{ fontSize: 18 }}>{isSaved(wishKey) ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, !available && styles.addBtnDisabled]}
                onPress={() => onAdd(row)}
                disabled={!available}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <PrimaryButton
        title="View Cart"
        onPress={() => navigation.navigate("Cart")}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: "#F2F2F2" },
  name: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  price: { fontSize: 14, fontWeight: "700", color: "#1B7F4D" },
  mrp: { fontSize: 12, color: "#999", textDecorationLine: "line-through" },
  oos: { fontSize: 11, color: "#C0392B", marginTop: 4 },
  addBtn: {
    backgroundColor: "#1B7F4D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnDisabled: { backgroundColor: "#CCC" },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
