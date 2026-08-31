import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import StoreDetailScreen from "@/screens/store/StoreDetailScreen";
import CartScreen from "@/screens/cart/CartScreen";
import CheckoutScreen from "@/screens/checkout/CheckoutScreen";
import OrderTrackingScreen from "@/screens/orders/OrderTrackingScreen";
import ReviewScreen from "@/screens/reviews/ReviewScreen";
import WalletScreen from "@/screens/wallet/WalletScreen";
import WishlistScreen from "@/screens/wishlist/WishlistScreen";
import NotificationSettingsScreen from "@/screens/profile/NotificationSettingsScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  StoreDetail: { storeId: number };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: number; pendingSubstitutionItemId?: number };
  Review: { orderId: number; storeName?: string };
  Wallet: undefined;
  Wishlist: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StoreDetail"
        component={StoreDetailScreen}
        options={{ title: "" }}
      />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Your Cart" }} />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Checkout" }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: "Order Status" }}
      />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Rate your order" }} />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: "Wallet" }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: "Wishlist" }} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
}
