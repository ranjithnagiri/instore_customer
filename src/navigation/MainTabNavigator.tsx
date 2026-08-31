import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "@/screens/home/HomeScreen";
import SearchScreen from "@/screens/search/SearchScreen";
import OrderHistoryScreen from "@/screens/orders/OrderHistoryScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import { useCart } from "@/context/CartContext";

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: "🏠",
  Search: "🔍",
  Orders: "📦",
  Profile: "👤",
};

export default function MainTabNavigator() {
  const { itemCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: "#1B7F4D",
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name as keyof MainTabParamList]}</Text>,
        tabBarBadge:
          route.name === "Home" && itemCount > 0 ? itemCount : undefined,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Community Store" }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} options={{ title: "My Orders" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
