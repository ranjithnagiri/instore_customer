import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import AuthNavigator from "@/navigation/AuthNavigator";
import RootNavigator from "@/navigation/RootNavigator";
import CompleteProfileScreen from "@/screens/auth/CompleteProfileScreen";
import { View, ActivityIndicator } from "react-native";

function Gate() {
  const { isLoading, isAuthenticated, isNewUser } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1B7F4D" />
      </View>
    );
  }

  if (!isAuthenticated) return <AuthNavigator />;
  if (isNewUser) return <CompleteProfileScreen />;
  return <RootNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Gate />
          </NavigationContainer>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
