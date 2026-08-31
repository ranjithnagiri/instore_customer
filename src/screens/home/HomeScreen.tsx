import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { fetchStoreCategories, fetchStoresForCommunity } from "@/api/catalog";
import { Store, StoreCategory } from "@/types";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

// PRD §2.2 Home: community name/flat, available stores, store categories,
// promo banners. §2.3 Store Selection: only stores mapped to the
// resident's community are shown.

export default function HomeScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser?.communityId) {
      setError("We couldn't find your community. Try completing your profile again.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [storesRes, catsRes] = await Promise.all([
        fetchStoresForCommunity(currentUser.communityId),
        fetchStoreCategories().catch(() => ({ data: [] as StoreCategory[] })),
      ]);
      setStores(storesRes.data ?? []);
      setCategories(catsRes.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't load stores. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.communityId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filteredStores = useMemo(
    () =>
      activeCategory
        ? stores.filter((s) => s.categoryId === activeCategory)
        : stores,
    [stores, activeCategory]
  );

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color="#1B7F4D" />
      </Screen>
    );
  }

  return (
    <Screen>
      {categories.length > 0 && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => String(c.id)}
          style={{ marginBottom: 14 }}
          renderItem={({ item }) => {
            const selected = activeCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(selected ? null : item.id)}
                style={[styles.catChip, selected && styles.catChipSelected]}
              >
                <Text style={[styles.catText, selected && styles.catTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FlatList
        data={filteredStores}
        keyExtractor={(s) => String(s.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={error ? "Something went wrong" : "No stores yet"}
            subtitle={error ?? "Check back soon — stores are being added to your community."}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storeCard}
            onPress={() => navigation.navigate("StoreDetail", { storeId: item.id })}
          >
            <Image
              source={{ uri: item.logoUrl || "https://placehold.co/80x80" }}
              style={styles.logo}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeMeta}>
                {item.deliveryTimeMin} min delivery • Prep {item.preparationTimeMin} min
              </Text>
              {!item.isOpen || item.isPaused ? (
                <Text style={styles.closedTag}>
                  {item.isPaused ? "Paused right now" : "Closed"}
                </Text>
              ) : (
                <Text style={styles.openTag}>Open now</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
    marginRight: 8,
  },
  catChipSelected: { backgroundColor: "#1B7F4D", borderColor: "#1B7F4D" },
  catText: { fontSize: 13, color: "#333" },
  catTextSelected: { color: "#fff", fontWeight: "600" },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  logo: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F2F2F2" },
  storeName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  storeMeta: { fontSize: 12, color: "#888", marginTop: 4 },
  openTag: { fontSize: 12, color: "#1B7F4D", marginTop: 4, fontWeight: "600" },
  closedTag: { fontSize: 12, color: "#C0392B", marginTop: 4, fontWeight: "600" },
});
