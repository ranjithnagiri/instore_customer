import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@/screens/auth/LoginScreen";
import OtpScreen from "@/screens/auth/OtpScreen";
import CompleteProfileScreen from "@/screens/auth/CompleteProfileScreen";

export type AuthStackParamList = {
  Login: undefined;
  Otp: { mobile: string };
  CompleteProfile: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Otp" component={OtpScreen} options={{ title: "" }} />
      <Stack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ title: "", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
