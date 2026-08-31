import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { fetchStoresForCommunity } from "@/api/catalog";
import { Store } from "@/types";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Search">,
  NativeStackScreenProps<RootStackParamList>
>;

// PRD §2.4 Search — search stores/products/food items (voice search is
// marked optional in the PRD and isn't implemented here).
//
// NOTE: The architecture doc calls for Elasticsearch-backed search, but
// the provided OpenAPI spec exposes no `/search` endpoint — only
// per-community store listing and per-store product/menu listing. This
// screen does a client-side filter over the resident's community
// stores as a stand-in; swap for a real search call once one exists.

export default function SearchScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.communityId) {
      setLoading(false);
      return;
    }
    fetchStoresForCommunity(currentUser.communityId)
      .then((res) => setStores(res.data ?? []))
      .finally(() => setLoading(false));
  }, [currentUser?.communityId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.storeType ?? "").toLowerCase().includes(q)
    );
  }, [stores, query]);

  return (
    <Screen>
      <TextInput
        style={styles.input}
        placeholder="Search stores, groceries, food…"
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#1B7F4D" />
      ) : query.trim().length === 0 ? (
        <EmptyState title="Search your community" subtitle="Try a store name or a category like “bakery”." />
      ) : (
        <FlatList
          style={{ marginTop: 12 }}
          data={results}
          keyExtractor={(s) => String(s.id)}
          ListEmptyComponent={<EmptyState title="No matches" subtitle="Try a different search term." />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("StoreDetail", { storeId: item.id })}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.storeType}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  name: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  type: { fontSize: 12, color: "#888", marginTop: 4, textTransform: "capitalize" },
});
