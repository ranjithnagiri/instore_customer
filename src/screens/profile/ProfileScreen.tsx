import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { fetchMyProfile } from "@/api/misc";
import { Resident } from "@/types";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { RootStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

// PRD §2.12 Profile — edit profile, notifications, saved payment
// methods (payment-method-on-file management isn't exposed by the
// given spec's schemas, so it's called out in the README as a gap).

const MENU_ITEMS: { key: keyof RootStackParamList; label: string; icon: string }[] = [
  { key: "Wallet", label: "Wallet", icon: "👛" },
  { key: "Wishlist", label: "Wishlist", icon: "❤️" },
  { key: "NotificationSettings", label: "Notification Settings", icon: "🔔" },
];

export default function ProfileScreen({ navigation }: Props) {
  const { currentUser, logout } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);

  useEffect(() => {
    fetchMyProfile()
      .then((res) => setResident(res.data))
      .catch(() => {});
  }, []);

  const onLogout = () => {
    Alert.alert("Log out?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(resident?.name || "R").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.name}>{resident?.name ?? "Resident"}</Text>
          <Text style={styles.sub}>
            Wallet Balance ₹{(resident?.walletBalance ?? 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {MENU_ITEMS.map((mi) => (
        <TouchableOpacity
          key={mi.key}
          style={styles.menuRow}
          onPress={() => navigation.navigate(mi.key as any)}
        >
          <Text style={styles.menuIcon}>{mi.icon}</Text>
          <Text style={styles.menuLabel}>{mi.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutRow} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1B7F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  name: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  sub: { fontSize: 12, color: "#888", marginTop: 4 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, color: "#1A1A1A", fontWeight: "500" },
  chevron: { fontSize: 18, color: "#BBB" },
  logoutRow: { marginTop: 20, alignItems: "center", padding: 12 },
  logoutText: { color: "#C0392B", fontWeight: "600" },
});
