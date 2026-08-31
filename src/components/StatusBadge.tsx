import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, { bg: string; fg: string }> = {
  order_placed: { bg: "#E8F0FE", fg: "#1A56DB" },
  accepted: { bg: "#EAF7EE", fg: "#1B7F4D" },
  preparing: { bg: "#FFF6E5", fg: "#B4740E" },
  packed: { bg: "#F1EEFB", fg: "#5B3FBF" },
  out_for_delivery: { bg: "#E5F7FA", fg: "#0E7C90" },
  delivered: { bg: "#E9F9EE", fg: "#1B7F4D" },
  cancelled: { bg: "#FCEAEA", fg: "#C0392B" },
  refunded: { bg: "#FCEAEA", fg: "#C0392B" },
};

const LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function StatusBadge({ status }: { status: string }) {
  const colors = COLORS[status] ?? { bg: "#EEE", fg: "#555" };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>
        {LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 12, fontWeight: "600" },
});
