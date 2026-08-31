import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { submitReview } from "@/api/misc";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Review">;

// PRD §2.13 Reviews — rate product, store, delivery; submit feedback.

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Text style={styles.star}>{n <= value ? "★" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen({ route, navigation }: Props) {
  const { orderId, storeName } = route.params;
  const [productRating, setProductRating] = useState(0);
  const [storeRating, setStoreRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReview({
        orderId,
        productRating: productRating || undefined,
        storeRating: storeRating || undefined,
        deliveryRating: deliveryRating || undefined,
        comment: comment || undefined,
      });
      Alert.alert("Thanks for the feedback!", "", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit review",
        e?.response?.data?.message ?? "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{storeName ?? "Your order"}</Text>
      <StarRow label="Product Quality" value={productRating} onChange={setProductRating} />
      <StarRow label="Store Experience" value={storeRating} onChange={setStoreRating} />
      <StarRow label="Delivery" value={deliveryRating} onChange={setDeliveryRating} />

      <Text style={styles.label}>Comments (optional)</Text>
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Tell us more about your experience"
        multiline
      />

      <PrimaryButton
        title="Submit Review"
        onPress={onSubmit}
        loading={submitting}
        disabled={!productRating && !storeRating && !deliveryRating}
        style={{ marginTop: 16 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1A1A1A" },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 8 },
  star: { fontSize: 30, color: "#F5A623", marginRight: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
