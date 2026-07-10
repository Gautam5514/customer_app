import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row, Card } from "../../src/components/ui";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useAuth } from "../../src/store/auth";
import { useLightStatusBar } from "../../src/lib/useStatusBar";
import { initials } from "../../src/lib/format";
import { colors, spacing, font, radii, shadow } from "../../src/theme";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  // The dark header scrolls away with the page, so a permanently-"light"
  // status bar would go invisible (white icons) once white content scrolls
  // underneath it. Flip to dark the moment the header's height scrolls past.
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pastHeader, setPastHeader] = useState(false);
  useLightStatusBar(!!user && !pastHeader);

  function onScroll(e) {
    const y = e.nativeEvent.contentOffset.y;
    const shouldBeDark = headerHeight > 0 && y > headerHeight - insets.top - 12;
    setPastHeader((prev) => (prev !== shouldBeDark ? shouldBeDark : prev));
  }

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

  function confirmSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  // Fast path — the 3 things a customer opens most, promoted above the fold.
  const quick = [
    { icon: "receipt-outline", label: "My bookings", onPress: () => router.push("/(tabs)/bookings") },
    { icon: "location-outline", label: "Saved addresses", onPress: () => router.push("/addresses") },
    { icon: "headset-outline", label: "Help & support", onPress: () => router.push("/help-support") },
  ];

  // Everything else — one tap away, grouped in a single settings list.
  const menu = [
    { icon: "pricetag-outline", label: "Offers & coupons", onPress: () => router.push("/offers") },
    { icon: "shield-checkmark-outline", label: "Privacy & terms", onPress: () => router.push("/privacy-terms") },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={32}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.avatar}>
          <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.xl}>{initials(user?.fullName) || "U"}</Txt>
        </View>
        <Txt color={colors.textOnInk} size={font.size.xl} weight={font.weight.bold} style={{ marginTop: spacing.md }}>{user?.fullName}</Txt>
        <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginTop: 2 }}>
          {user?.phone ? `+91 ${user.phone}` : user?.email}
        </Txt>
      </View>

      <View style={{ padding: spacing.xl }}>
        {/* Quick actions — the fast path */}
        <Row gap={spacing.md} style={{ marginBottom: spacing.xl }}>
          {quick.map((q) => (
            <Pressable
              key={q.label}
              onPress={q.onPress}
              style={({ pressed }) => [styles.quickCard, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={q.icon} size={19} color={colors.ink} />
              </View>
              <Txt weight={font.weight.semibold} size={font.size.sm} style={{ marginTop: spacing.sm }}>{q.label}</Txt>
            </Pressable>
          ))}
        </Row>

        {/* Settings list */}
        <Card padded={false} style={{ overflow: "hidden" }}>
          {menu.map((it, i) => (
            <Pressable key={it.label} onPress={it.onPress} style={({ pressed }) => [styles.rowItem, i < menu.length - 1 && styles.rowBorder, pressed && { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.itemIcon}><Ionicons name={it.icon} size={19} color={colors.ink} /></View>
              <Txt weight={font.weight.medium} size={font.size.md} style={{ flex: 1 }}>{it.label}</Txt>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </Card>

        {/* Promo — the one live coupon, presented as a tappable highlight card */}
        <Pressable onPress={() => router.push("/offers")} style={({ pressed }) => [styles.promo, pressed && { opacity: 0.92 }]}>
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.bold} size={font.size.md}>Flat ₹100 off your first booking</Txt>
            <Txt muted size={font.size.sm} style={{ marginTop: 2, lineHeight: 19 }}>
              Use code <Txt weight={font.weight.bold} color={colors.ink}>ELITE100</Txt> at checkout
            </Txt>
            <View style={styles.promoBtn}>
              <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.sm}>View offers</Txt>
            </View>
          </View>
          <Ionicons name="pricetag" size={26} color={colors.gold} />
        </Pressable>

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
    borderBottomLeftRadius: radii.xxl, borderBottomRightRadius: radii.xxl, paddingHorizontal: spacing.xl,
    ...shadow.lifted,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  exploreBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.soft,
  },
  exploreIcon: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },

  quickCard: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    backgroundColor: colors.surface, padding: spacing.md,
    ...shadow.soft,
  },
  quickIcon: {
    width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },

  rowItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },

  promo: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md,
    backgroundColor: colors.goldSoft, borderRadius: radii.lg, padding: spacing.lg,
    marginTop: spacing.xl,
  },
  promoBtn: {
    marginTop: spacing.md, alignSelf: "flex-start", backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radii.md,
  },

  signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.xl, paddingVertical: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
});
