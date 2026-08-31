import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useCart } from "@/context/CartContext";
import { applyCoupon } from "@/api/misc";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

// PRD §2.6 Cart — add/remove/update qty, coupon, delivery charges, tax,
// total amount.

const DELIVERY_FEE = 25;
const PLATFORM_FEE = 5;

export default function CartScreen({ navigation }: Props) {
  const { items, subtotal, updateQuantity, removeItem, storeId } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const taxable = subtotal - discount;
  const tax = Math.max(0, taxable) * 0.05; // illustrative 5% GST-style tax
  const total = Math.max(0, taxable) + tax + DELIVERY_FEE + PLATFORM_FEE;

  const onApplyCoupon = async () => {
    if (!couponCode.trim() || !storeId) return;
    setApplying(true);
    setCouponMsg(null);
    try {
      const res = await applyCoupon({
        couponCode: couponCode.trim(),
        storeId,
        orderSubtotal: subtotal,
      });
      if (res.data.isValid) {
        setDiscount(res.data.discountAmount);
        setCouponMsg(`Coupon applied — you saved ₹${res.data.discountAmount.toFixed(2)}`);
      } else {
        setDiscount(0);
        setCouponMsg(res.data.errorMessage || "Coupon isn't valid for this order.");
      }
    } catch (e: any) {
      setDiscount(0);
      setCouponMsg(e?.response?.data?.message ?? "Couldn't apply that coupon.");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Your cart is empty"
          subtitle="Browse stores in your community to get started."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₹{item.unitPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyBox}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.key, item.quantity - 1)}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.key, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.key)} style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Have a coupon code?"
                value={couponCode}
                autoCapitalize="characters"
                onChangeText={setCouponCode}
              />
              <TouchableOpacity
                style={styles.couponBtn}
                onPress={onApplyCoupon}
                disabled={applying || !couponCode.trim()}
              >
                <Text style={styles.couponBtnText}>{applying ? "..." : "Apply"}</Text>
              </TouchableOpacity>
            </View>
            {couponMsg && <Text style={styles.couponMsg}>{couponMsg}</Text>}

            <View style={styles.summaryBox}>
              <SummaryLine label="Subtotal" value={subtotal} />
              {discount > 0 && <SummaryLine label="Discount" value={-discount} highlight />}
              <SummaryLine label="Tax" value={tax} />
              <SummaryLine label="Delivery Fee" value={DELIVERY_FEE} />
              <SummaryLine label="Platform Fee" value={PLATFORM_FEE} />
              <View style={styles.divider} />
              <SummaryLine label="Total" value={total} bold />
            </View>
          </View>
        }
      />

      <PrimaryButton
        title={`Proceed to Checkout · ₹${total.toFixed(2)}`}
        onPress={() => navigation.navigate("Checkout")}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}

function SummaryLine({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, bold && styles.bold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.bold,
          highlight && { color: "#1B7F4D" },
        ]}
      >
        {value < 0 ? "−" : ""}₹{Math.abs(value).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  name: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  price: { fontSize: 12, color: "#888", marginTop: 4 },
  qtyBox: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#333" },
  qtyValue: { marginHorizontal: 10, fontSize: 14, fontWeight: "600" },
  couponRow: { flexDirection: "row", marginTop: 10 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  couponBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
  },
  couponBtnText: { color: "#fff", fontWeight: "600" },
  couponMsg: { fontSize: 12, color: "#666", marginTop: 6 },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: "#555" },
  summaryValue: { fontSize: 13, color: "#333" },
  bold: { fontWeight: "700", fontSize: 15, color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 6 },
});
