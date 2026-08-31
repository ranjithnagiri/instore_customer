import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useWishlist } from "@/context/WishlistContext";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Wishlist">;

// PRD §2.11 Wishlist — save products, favorite stores. (See
// WishlistContext for why this is on-device rather than server-synced.)

export default function WishlistScreen({ navigation }: Props) {
  const { items, toggle } = useWishlist();

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        ListEmptyComponent={
          <EmptyState
            title="Nothing saved yet"
            subtitle="Tap the heart on any product to save it here."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("StoreDetail", { storeId: item.storeId })}
          >
            <Image
              source={{ uri: item.imageUrl || "https://placehold.co/56x56" }}
              style={styles.thumb}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => toggle(item)}>
              <Text style={{ fontSize: 18 }}>❤️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#F2F2F2" },
  name: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  price: { fontSize: 12, color: "#1B7F4D", marginTop: 4, fontWeight: "600" },
});
