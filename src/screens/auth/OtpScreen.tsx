import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import {
  OTP_EXPIRY_SECONDS,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/constants/config";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

// Reflects PRD §3 OTP policy: 6-digit, 5-min expiry, max 5 attempts,
// 30s resend cooldown, all enforced client-side as a UX guard (the
// server is the source of truth and will reject stale/overused OTPs).

export default function OtpScreen({ route, navigation }: Props) {
  const { mobile } = route.params;
  const { verifyOtp, requestOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(
    OTP_RESEND_COOLDOWN_SECONDS
  );

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const expired = secondsLeft === 0;
  const isValid = otp.length === OTP_LENGTH;

  const onVerify = async () => {
    if (expired) {
      Alert.alert("Code expired", "Please request a new OTP.");
      return;
    }
    if (attemptsLeft <= 0) {
      Alert.alert("Too many attempts", "Please request a new OTP.");
      return;
    }
    setLoading(true);
    try {
      const { isNewUser } = await verifyOtp(mobile, otp);
      if (isNewUser) {
        navigation.replace("CompleteProfile");
      }
      // If not a new user, RootNavigator swaps to MainTabNavigator
      // automatically once AuthContext.isAuthenticated flips true.
    } catch (e: any) {
      setAttemptsLeft((a) => Math.max(0, a - 1));
      Alert.alert(
        "Incorrect code",
        e?.response?.data?.message ?? "Please check the OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await requestOtp(mobile);
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setAttemptsLeft(OTP_MAX_ATTEMPTS);
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch (e: any) {
      Alert.alert(
        "Couldn't resend",
        e?.response?.data?.message ?? "Please try again shortly."
      );
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Screen>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>
        Enter the {OTP_LENGTH}-digit code sent to +91 {mobile}
      </Text>

      <TextInput
        style={styles.otpInput}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        placeholder="••••••"
        autoFocus
      />

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {expired ? "Code expired" : `Expires in ${mm}:${ss}`}
        </Text>
        <Text style={styles.meta}>{attemptsLeft} attempts left</Text>
      </View>

      <PrimaryButton
        title="Verify & Continue"
        onPress={onVerify}
        loading={loading}
        disabled={!isValid || expired || attemptsLeft <= 0}
        style={{ marginTop: 20 }}
      />

      <PrimaryButton
        title={resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
        onPress={onResend}
        disabled={resendCooldown > 0}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginTop: 24, color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 8, marginBottom: 28 },
  otpInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    paddingVertical: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  meta: { fontSize: 12, color: "#888" },
});
