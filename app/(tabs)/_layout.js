import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../src/lib/queries";
import { useRealtime } from "../../src/lib/useRealtime";
import { colors, font } from "../../src/theme";

function Badge({ count }) {
  if (!count) return null;
  return (
    <View
      style={{
        position: "absolute", top: -5, right: -11, minWidth: 17, height: 17,
        borderRadius: 9, backgroundColor: colors.danger, alignItems: "center",
        justifyContent: "center", paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.surface,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  useRealtime();
  const insets = useSafeAreaInsets();
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // Safe-area aware: sits above the home indicator on iOS and above
          // gesture/3-button nav on Android instead of a fixed 86px guess.
          height: 58 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: font.size.xs, fontWeight: font.weight.semibold, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: "Bookings", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "receipt" : "receipt-outline"} size={23} color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={23} color={color} />
              <Badge count={unread} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={23} color={color} /> }}
      />
    </Tabs>
  );
}
