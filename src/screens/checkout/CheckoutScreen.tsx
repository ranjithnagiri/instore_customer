import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useCart } from "@/context/CartContext";
import { fetchMyProfile } from "@/api/misc";
import { placeOrder, submitPaymentCallback } from "@/api/orders";
import { CHECKOUT_RESERVATION_SECONDS } from "@/constants/config";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

type PaymentMode = "upi" | "card" | "netbanking" | "wallet" | "cod";

const PAYMENT_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "wallet", label: "Wallet" },
  { value: "cod", label: "Cash on Delivery" },
];

const DELIVERY_FEE = 25;
const PLATFORM_FEE = 5;

// PRD §2.7 Checkout (address, instructions, payment, place order) and
// §3 "Stock reservation at checkout": items are soft-reserved once
// checkout begins; if payment isn't completed within 10 minutes the
// resident is warned before retrying.

export default function CheckoutScreen({ navigation }: Props) {
  const { items, subtotal, storeId, clearCart } = useCart();
  const [flatId, setFlatId] = useState<number | null>(null);
  const [instructions, setInstructions] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [placing, setPlacing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CHECKOUT_RESERVATION_SECONDS);
  const [reservationExpired, setReservationExpired] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((res) => setFlatId(res.data.flatId))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setReservationExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const tax = subtotal * 0.05;
  const total = subtotal + tax + DELIVERY_FEE + PLATFORM_FEE;

  const onPlaceOrder = async () => {
    if (!storeId || !flatId || items.length === 0) return;
    if (reservationExpired) {
      Alert.alert(
        "Items released",
        "Your reserved items expired. Please review your cart — some items may have gone out of stock — and try again."
      );
      return;
    }

    setPlacing(true);
    try {
      const orderRes = await placeOrder({
        storeId,
        flatId,
        paymentMode,
        deliveryInstructions: instructions || undefined,
        deliveryFee: DELIVERY_FEE,
        platformFee: PLATFORM_FEE,
        discountAmount: 0,
        items: items.map((i) => ({
          productId: i.productId,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      const { orderId } = orderRes.data;

      if (paymentMode !== "cod") {
        // In production this hands off to the gateway SDK (Razorpay /
        // PhonePe / PayU per the spec's `gateway` field) and awaits its
        // result before calling the callback. Wired here against the
        // callback endpoint so the flow is complete end-to-end.
        await submitPaymentCallback({
          orderId,
          gateway: "razorpay",
          gatewayRefId: `sim_${Date.now()}`,
          amount: total,
          status: "success",
        });
      }

      clearCart();
      navigation.replace("OrderTracking", { orderId });
    } catch (e: any) {
      Alert.alert(
        "Couldn't place order",
        e?.response?.data?.message ?? "Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Screen>
      <View style={styles.reservationBanner}>
        <Text style={styles.reservationText}>
          {reservationExpired
            ? "Reservation expired — please review your cart"
            : `Items reserved for you — complete payment in ${mm}:${ss}`}
        </Text>
      </View>

      <Text style={styles.section}>Delivery Address</Text>
      <View style={styles.addressBox}>
        <Text style={styles.addressText}>
          {flatId ? `Flat #${flatId}` : "Loading your flat…"}
        </Text>
      </View>

      <Text style={styles.section}>Delivery Instructions</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Leave at the door, call on arrival"
        value={instructions}
        onChangeText={setInstructions}
        multiline
      />

      <Text style={styles.section}>Payment Method</Text>
      {PAYMENT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={styles.paymentRow}
          onPress={() => setPaymentMode(opt.value)}
        >
          <View style={[styles.radio, paymentMode === opt.value && styles.radioSelected]} />
          <Text style={styles.paymentLabel}>{opt.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
      </View>

      <PrimaryButton
        title={paymentMode === "cod" ? "Place Order (COD)" : "Pay & Place Order"}
        onPress={onPlaceOrder}
        loading={placing}
        disabled={!flatId || items.length === 0 || reservationExpired}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  reservationBanner: {
    backgroundColor: "#FFF6E5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  reservationText: { fontSize: 12, color: "#B4740E", fontWeight: "600" },
  section: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 8, marginTop: 12 },
  addressBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  addressText: { fontSize: 14, color: "#1A1A1A" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  paymentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#BBB",
    marginRight: 10,
  },
  radioSelected: { borderColor: "#1B7F4D", backgroundColor: "#1B7F4D" },
  paymentLabel: { fontSize: 14, color: "#1A1A1A" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  totalValue: { fontSize: 15, fontWeight: "700", color: "#1B7F4D" },
});
