import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchOrderHistory } from "@/api/orders";
import { OrderHistoryRow } from "@/types";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Orders">,
  NativeStackScreenProps<RootStackParamList>
>;

// PRD §2.10 Order History — previous orders, repeat order, invoice.
// "Repeat order" re-adds the same store's items via the cart screen;
// "download invoice" needs a dedicated export endpoint not present in
// the given spec, so it's called out as a follow-up in the README.

export default function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<OrderHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchOrderHistory();
      setOrders(res.data ?? []);
    } catch {
      // Leave prior state; user can pull to refresh.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        data={orders}
        keyExtractor={(o) => String(o.orderId)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <EmptyState title="No orders yet" subtitle="Your past orders will show up here." />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("OrderTracking", { orderId: item.orderId })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{item.storeName}</Text>
              <Text style={styles.meta}>
                #{item.orderNumber} • {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
              </Text>
              {item.placedAt && (
                <Text style={styles.meta}>
                  {new Date(item.placedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amount}>₹{item.totalAmount.toFixed(2)}</Text>
              <StatusBadge status={item.status} />
              {item.status === "delivered" && !item.storeRating && (
                <Text style={styles.rateHint}>Tap to rate</Text>
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
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  storeName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  meta: { fontSize: 12, color: "#888", marginTop: 4 },
  amount: { fontSize: 15, fontWeight: "700", color: "#1B7F4D", marginBottom: 6 },
  rateHint: { fontSize: 11, color: "#1A56DB", marginTop: 6 },
});
