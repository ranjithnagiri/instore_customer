import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { AuthStackParamList } from "@/navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

// PRD §2.1 Authentication — Mobile Login / OTP Login (guest & social
// login are marked optional in the PRD and are not wired to a real
// provider here; OTP is the primary, fully-implemented flow).

export default function LoginScreen({ navigation }: Props) {
  const { requestOtp } = useAuth();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[0-9]{10}$/.test(mobile);

  const onContinue = async () => {
    if (!isValid) {
      Alert.alert("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await requestOtp(mobile);
      navigation.navigate("Otp", { mobile });
    } catch (e: any) {
      Alert.alert(
        "Couldn't send OTP",
        e?.response?.data?.message ?? "Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome 👋</Text>
        <Text style={styles.subtitle}>
          Groceries, food and more — delivered from stores in your community.
        </Text>
      </View>

      <Text style={styles.label}>Mobile Number</Text>
      <View style={styles.inputRow}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, "").slice(0, 10))}
          keyboardType="number-pad"
          placeholder="98765 43210"
          maxLength={10}
        />
      </View>

      <PrimaryButton
        title="Send OTP"
        onPress={onContinue}
        loading={loading}
        disabled={!isValid}
        style={{ marginTop: 24 }}
      />

      <Text style={styles.terms}>
        We'll text you a 6-digit code to verify it's you. Standard message
        rates may apply.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 24, marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 8, lineHeight: 20 },
  label: { fontSize: 13, color: "#444", marginBottom: 6, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  prefix: {
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#EEE",
    paddingVertical: 14,
  },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 16, paddingVertical: 14 },
  terms: { fontSize: 12, color: "#999", marginTop: 16, lineHeight: 18 },
});
