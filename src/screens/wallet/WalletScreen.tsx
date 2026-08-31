import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { fetchWalletLedger } from "@/api/misc";
import { WalletLedgerRow } from "@/types";

// PRD §3 "Wallet ledger" — transaction-level ledger, not just a
// balance: every credit/debit with reason and linked order.

const REASON_LABELS: Record<string, string> = {
  refund: "Refund",
  cashback: "Cashback",
  referral: "Referral Bonus",
  manual_adjustment: "Adjustment",
};

export default function WalletScreen() {
  const [rows, setRows] = useState<WalletLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletLedger()
      .then((res) => setRows(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color="#1B7F4D" />
      </Screen>
    );
  }

  const balance = rows[0]?.currentBalance ?? 0;

  return (
    <Screen>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        ListEmptyComponent={
          <EmptyState title="No transactions yet" subtitle="Refunds and cashback will appear here." />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reason}>
                {REASON_LABELS[item.reasonCode] ?? item.reasonCode}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>
              {item.referenceOrderId && (
                <Text style={styles.orderRef}>Order #{item.referenceOrderId}</Text>
              )}
            </View>
            <Text style={[styles.amount, item.amount < 0 && styles.debit]}>
              {item.amount >= 0 ? "+" : ""}₹{item.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  balanceCard: {
    backgroundColor: "#1B7F4D",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
  },
  balanceLabel: { color: "#DFF3E6", fontSize: 13 },
  balanceValue: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 6 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },
  reason: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  date: { fontSize: 11, color: "#999", marginTop: 2 },
  orderRef: { fontSize: 11, color: "#999", marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "700", color: "#1B7F4D" },
  debit: { color: "#C0392B" },
});
