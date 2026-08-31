import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  cancelOrder,
  fetchOrderTracking,
  respondToSubstitution,
} from "@/api/orders";
import { OrderTrackingRow } from "@/types";
import { ORDER_TRACKING_POLL_MS, SUBSTITUTION_DECISION_SECONDS } from "@/constants/config";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OrderTracking">;

// PRD §2.9 Order Tracking (real-time status, ETA, call store) and §3
// "Substitution approval flow" (approve/decline with a 15-min
// countdown; default action after the window is a refund, handled
// server-side — this screen mirrors that countdown for the resident).
const STEPS = [
  "order_placed",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
];

export default function OrderTrackingScreen({ route, navigation }: Props) {
  const { orderId, pendingSubstitutionItemId } = route.params;
  const [row, setRow] = useState<OrderTrackingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [subItemId, setSubItemId] = useState(
    pendingSubstitutionItemId ? String(pendingSubstitutionItemId) : ""
  );
  const [subSecondsLeft, setSubSecondsLeft] = useState(
    pendingSubstitutionItemId ? SUBSTITUTION_DECISION_SECONDS : 0
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchOrderTracking(orderId);
      setRow((res.data ?? [])[0] ?? null);
    } catch {
      // Keep last known state on transient failure; polling will retry.
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, ORDER_TRACKING_POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  useEffect(() => {
    if (subSecondsLeft <= 0) return;
    const t = setInterval(() => setSubSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [subSecondsLeft]);

  const onCancel = () => {
    Alert.alert("Cancel this order?", "This can't be undone.", [
      { text: "Keep Order", style: "cancel" },
      {
        text: "Cancel Order",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(orderId, "Cancelled by resident");
            load();
          } catch (e: any) {
            Alert.alert(
              "Couldn't cancel",
              e?.response?.data?.message ?? "Please try again."
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const onRespondSubstitution = async (approve: boolean) => {
    const id = Number(subItemId);
    if (!id) {
      Alert.alert("Enter the item reference from the notification");
      return;
    }
    try {
      await respondToSubstitution(id, approve);
      Alert.alert(
        approve ? "Substitution approved" : "Substitution declined",
        approve
          ? "The store will proceed with the substitute item."
          : "You'll be refunded the item amount."
      );
      setSubSecondsLeft(0);
      setSubItemId("");
      load();
    } catch (e: any) {
      Alert.alert(
        "Couldn't record your response",
        e?.response?.data?.message ?? "Please try again."
      );
    }
  };

  if (loading && !row) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color="#1B7F4D" />
      </Screen>
    );
  }

  if (!row) {
    return (
      <Screen style={styles.center}>
        <Text>We couldn't find this order.</Text>
      </Screen>
    );
  }

  const currentStepIndex = STEPS.indexOf(row.status);
  const isTerminal = ["delivered", "cancelled", "refunded"].includes(row.status);
  const mm = String(Math.floor(subSecondsLeft / 60)).padStart(2, "0");
  const ss = String(subSecondsLeft % 60).padStart(2, "0");

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>Order #{row.orderNumber}</Text>
        <StatusBadge status={row.status} />
      </View>
      <Text style={styles.storeName}>{row.storeName}</Text>
      {row.status !== "delivered" && row.status !== "cancelled" && (
        <Text style={styles.eta}>
          Est. delivery {new Date(row.estimatedDeliveryTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      {!["cancelled", "refunded"].includes(row.status) && (
        <View style={styles.timeline}>
          {STEPS.map((step, idx) => (
            <View key={step} style={styles.timelineRow}>
              <View
                style={[
                  styles.dot,
                  idx <= currentStepIndex && styles.dotActive,
                ]}
              />
              <Text
                style={[
                  styles.timelineLabel,
                  idx <= currentStepIndex && styles.timelineLabelActive,
                ]}
              >
                {STEP_LABELS[step]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {row.storeContact && (
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${row.storeContact}`)}
        >
          <Text style={styles.callBtnText}>📞 Call {row.storeName}</Text>
        </TouchableOpacity>
      )}

      {subSecondsLeft > 0 && (
        <View style={styles.subBox}>
          <Text style={styles.subTitle}>
            The store proposed a substitution — respond within {mm}:{ss}
          </Text>
          <TextInput
            style={styles.subInput}
            value={subItemId}
            onChangeText={setSubItemId}
            placeholder="Item reference (from notification)"
            keyboardType="number-pad"
          />
          <View style={styles.subActions}>
            <PrimaryButton
              title="Decline"
              variant="secondary"
              onPress={() => onRespondSubstitution(false)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <PrimaryButton
              title="Approve"
              onPress={() => onRespondSubstitution(true)}
              style={{ flex: 1 }}
            />
          </View>
          <Text style={styles.subNote}>
            No response after the countdown automatically refunds this item.
          </Text>
        </View>
      )}

      {!isTerminal && (
        <PrimaryButton
          title="Cancel Order"
          variant="danger"
          onPress={onCancel}
          loading={cancelling}
          style={{ marginTop: 24 }}
        />
      )}

      {row.status === "delivered" && (
        <PrimaryButton
          title="Rate this order"
          onPress={() =>
            navigation.navigate("Review", { orderId: row.orderId, storeName: row.storeName ?? undefined })
          }
          style={{ marginTop: 24 }}
        />
      )}
    </Screen>
  );
}

const STEP_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNumber: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  storeName: { fontSize: 14, color: "#555", marginTop: 4 },
  eta: { fontSize: 12, color: "#888", marginTop: 4 },
  timeline: { marginTop: 24 },
  timelineRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DDD",
    marginRight: 12,
  },
  dotActive: { backgroundColor: "#1B7F4D" },
  timelineLabel: { fontSize: 14, color: "#AAA" },
  timelineLabelActive: { color: "#1A1A1A", fontWeight: "600" },
  callBtn: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1B7F4D",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  callBtnText: { color: "#1B7F4D", fontWeight: "600" },
  subBox: {
    marginTop: 20,
    backgroundColor: "#FFF6E5",
    borderRadius: 12,
    padding: 14,
  },
  subTitle: { fontSize: 13, fontWeight: "700", color: "#B4740E", marginBottom: 10 },
  subInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  subActions: { flexDirection: "row" },
  subNote: { fontSize: 11, color: "#B4740E", marginTop: 8 },
});
