import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row } from "../../src/components/ui";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { ReferEarnCard } from "../../src/components/ReferEarnCard";
import { useAuth } from "../../src/store/auth";
import { colors, spacing, font, radii } from "../../src/theme";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  // Guests see the sign-in prompt rather than an empty profile shell. The
  // "New here?" walkthrough lives only here (guest view) — once signed in,
  // the user already knows the app, so it doesn't show anywhere else.
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <SignInPrompt
          icon="person-circle-outline"
          title="Your account"
          subtitle="Sign in to manage addresses, bookings, offers and more."
        />
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={({ pressed }) => [styles.exploreBanner, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.exploreIcon}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.semibold} size={font.size.sm}>New here? See how EliteCrew works</Txt>
            <Txt muted size={font.size.xs} style={{ marginTop: 1 }}>Why us, pricing & every service — 30 sec read</Txt>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      </View>
    );
  }

  const incomplete = !user?.fullName || !user?.phone;

  function confirmLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  }

  function comingSoon(title, icon, blurb) {
    router.push({ pathname: "/coming-soon", params: { title, icon, blurb } });
  }

  // Quick cards — the fast path, styled as UC's flat outlined tiles.
  const quick = [
    { icon: "clipboard-outline", label: "My\nbookings", onPress: () => router.push("/(tabs)/bookings") },
    { icon: "pricetag-outline", label: "Offers &\ncoupons", onPress: () => router.push("/offers") },
    { icon: "headset-outline", label: "Help &\nsupport", onPress: () => router.push("/help-support") },
  ];

  // The account menu — UC's list, mapped to real screens where they exist.
  const menu = [
    { icon: "reader-outline", label: "My Plans", onPress: () => comingSoon("My Plans", "reader-outline", "Service plans tailored to your home, with member pricing on every booking.") },
    { icon: "wallet-outline", label: "Wallet", onPress: () => comingSoon("Wallet", "wallet-outline", "Add money, track refunds and pay for bookings in a single tap.") },
    { icon: "disc-outline", label: "Passes & membership", onPress: () => comingSoon("Passes & membership", "disc-outline", "Unlock member-only rates, priority slots and exclusive perks.") },
    { icon: "star-outline", label: "My rating", onPress: () => comingSoon("My rating", "star-outline", "See how professionals rate their experience working with you.") },
    { icon: "location-outline", label: "Manage addresses", onPress: () => router.push("/addresses") },
    { icon: "card-outline", label: "Manage payment methods", onPress: () => comingSoon("Manage payment methods", "card-outline", "Save cards and UPI for a faster, one-tap checkout.") },
    { icon: "shield-checkmark-outline", label: "Privacy & terms", onPress: () => router.push("/privacy-terms") },
    { icon: "information-circle-outline", label: "About EliteCrew", onPress: () => router.push("/onboarding") },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — name + phone on plain white, UC style */}
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl }}>
        {incomplete ? (
          <Row justify="space-between" style={{ marginBottom: spacing.md }}>
            <View style={styles.incompletePill}>
              <Ionicons name="alert-circle" size={15} color={colors.danger} />
              <Txt color={colors.danger} weight={font.weight.semibold} size={font.size.sm}>Incomplete profile</Txt>
            </View>
            <Pressable
              onPress={() => router.push("/edit-profile")}
              style={({ pressed }) => [styles.completeBtn, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <Txt weight={font.weight.semibold} size={font.size.md}>Complete</Txt>
            </Pressable>
          </Row>
        ) : null}
        <Txt size={30} weight={font.weight.bold} style={{ letterSpacing: -0.4 }}>
          {user?.fullName || "Your name"}
        </Txt>
        <Txt muted size={font.size.md} style={{ marginTop: 6 }}>
          {user?.phone ? `+91 ${user.phone}` : user?.email}
        </Txt>

        {/* Quick cards */}
        <Row gap={spacing.md} align="stretch" style={{ marginTop: spacing.xl }}>
          {quick.map((q) => (
            <Pressable
              key={q.label}
              onPress={q.onPress}
              style={({ pressed }) => [styles.quickCard, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name={q.icon} size={26} color={colors.ink} />
              <Txt size={font.size.md} style={{ marginTop: spacing.md, lineHeight: 23 }}>{q.label}</Txt>
            </Pressable>
          ))}
        </Row>
      </View>

      {/* Gray band separator, UC style */}
      <View style={styles.band} />

      {/* Account menu — flat rows, thin icons, chevrons */}
      <View style={{ paddingVertical: spacing.sm }}>
        {menu.map((it) => (
          <Pressable
            key={it.label}
            onPress={it.onPress}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons name={it.icon} size={21} color={colors.ink} />
            <Txt size={font.size.lg} style={{ flex: 1 }}>{it.label}</Txt>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        {/* Refer & earn — purple highlight card with gift, UC style */}
        <ReferEarnCard style={{ marginTop: spacing.md }} />

        {/* Logout — outlined, red text, UC style */}
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logout, pressed && { backgroundColor: colors.surfaceAlt }]}
        >
          <Txt color={colors.danger} weight={font.weight.semibold} size={font.size.lg}>Logout</Txt>
        </Pressable>

        <Txt faint center size={font.size.sm} style={{ marginTop: spacing.xl }}>Version 1.0.0</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  exploreBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  exploreIcon: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },

  incompletePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.dangerSoft, borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  completeBtn: {
    borderWidth: 1, borderColor: colors.ink, borderRadius: radii.sm,
    paddingHorizontal: 18, paddingVertical: 9, backgroundColor: colors.surface,
  },

  quickCard: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm,
    backgroundColor: colors.surface, padding: spacing.lg,
  },

  band: { height: 8, backgroundColor: colors.surfaceSunken, marginTop: spacing.xl },

  menuRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.lg,
    paddingHorizontal: spacing.xl, paddingVertical: 17,
  },

  logout: {
    marginTop: spacing.xl, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    paddingVertical: 15, backgroundColor: colors.surface,
  },
});
