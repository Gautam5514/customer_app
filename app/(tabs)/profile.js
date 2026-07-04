import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row, Card } from "../../src/components/ui";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useAuth } from "../../src/store/auth";
import { useLightStatusBar } from "../../src/lib/useStatusBar";
import { initials } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  useLightStatusBar(!!user); // dark header only when signed in

  // Guests see the sign-in prompt rather than an empty profile shell.
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <SignInPrompt
          icon="person-circle-outline"
          title="Your account"
          subtitle="Sign in to manage addresses, bookings, offers and more."
        />
      </View>
    );
  }

  function confirmSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  // Every item opens a full in-app page — no alerts, no mailto dead-ends.
  const items = [
    { icon: "location-outline", label: "Saved addresses", onPress: () => router.push("/addresses") },
    { icon: "receipt-outline", label: "My bookings", onPress: () => router.push("/(tabs)/bookings") },
    { icon: "pricetag-outline", label: "Offers & coupons", onPress: () => router.push("/offers") },
    { icon: "headset-outline", label: "Help & support", onPress: () => router.push("/help-support") },
    { icon: "shield-checkmark-outline", label: "Privacy & terms", onPress: () => router.push("/privacy-terms") },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}>
          <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.xl}>{initials(user?.fullName) || "U"}</Txt>
        </View>
        <Txt color={colors.textOnInk} size={font.size.xl} weight={font.weight.bold} style={{ marginTop: spacing.md }}>{user?.fullName}</Txt>
        <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginTop: 2 }}>{user?.email}</Txt>
      </View>

      <View style={{ padding: spacing.xl }}>
        <Card padded={false} style={{ overflow: "hidden" }}>
          {items.map((it, i) => (
            <Pressable key={it.label} onPress={it.onPress} style={({ pressed }) => [styles.rowItem, i < items.length - 1 && styles.rowBorder, pressed && { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.itemIcon}><Ionicons name={it.icon} size={19} color={colors.ink} /></View>
              <Txt weight={font.weight.medium} size={font.size.md} style={{ flex: 1 }}>{it.label}</Txt>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </Card>

        <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signout, pressed && { opacity: 0.8 }]}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Txt color={colors.danger} weight={font.weight.semibold}>Sign out</Txt>
        </Pressable>

        <Txt faint center size={font.size.xs} style={{ marginTop: spacing.xl }}>EliteCrew · v1.0.0</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink, alignItems: "center", paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl, paddingHorizontal: spacing.xl,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  rowItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.xl, paddingVertical: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
});
