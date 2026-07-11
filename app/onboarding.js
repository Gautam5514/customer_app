import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "../src/components/Logo";
import { CategoryTile } from "../src/components/CategoryIcon";
import { Button, Txt, Row, Card } from "../src/components/ui";
import { useAuth } from "../src/store/auth";
import { useLightStatusBar } from "../src/lib/useStatusBar";
import { colors, spacing, font, radii, shadow } from "../src/theme";

// The "what EliteCrew does, why to use it, every service on offer" story.
// Reached from Home via "Explore EliteCrew" — not a forced first screen, so
// it needs its own close affordance rather than only forward-moving CTAs.

const SERVICES = [
  { key: "ac", label: "AC Repair" },
  { key: "fridge", label: "Refrigerator" },
  { key: "cooler", label: "Air Cooler" },
  { key: "fan", label: "Fan & Motor" },
  { key: "tv", label: "Television" },
  { key: "electrical", label: "Electrician" },
  { key: "appliance", label: "Appliances" },
];

const WHY = [
  { icon: "shield-checkmark", title: "Verified professionals", sub: "Background-checked & trained" },
  { icon: "pricetag", title: "Honest, upfront pricing", sub: "Full quote before you book" },
  { icon: "flash", title: "Same-day service", sub: "Book now, get sorted today" },
  { icon: "refresh", title: "30-day warranty", sub: "Every job, guaranteed" },
];

const STATS = [
  { value: "4.8★", label: "Avg rating" },
  { value: "50k+", label: "Jobs done" },
  { value: "100%", label: "Verified" },
];

const HOW = [
  "Browse services & see upfront prices",
  "Pick a time slot that suits you",
  "Sit back - pay only after the job's done",
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, booting } = useAuth();

  // Signed-in customers must never be greeted by this pitch on app open. If
  // this screen mounted as the very first screen (no back history) and a
  // session exists, bounce straight to the home tabs. Opening it on purpose
  // (Profile → "About EliteCrew") has back history, so it still shows.
  const coldStart = !router.canGoBack();
  useEffect(() => {
    if (!booting && user && coldStart) router.replace("/(tabs)");
  }, [booting, user, coldStart]);

  // The hero is dark and scrolls away with the page, so the status bar can't
  // stay permanently "light" — once the white sections below scroll under it,
  // white clock/battery icons on a white background go invisible. We measure
  // the hero's real height and flip the status bar to dark the moment its
  // dark background scrolls out from under the status bar area.
  const [heroHeight, setHeroHeight] = useState(0);
  const [pastHero, setPastHero] = useState(false);
  useLightStatusBar(!pastHero);

  // The CTA footer is absolutely positioned over the scroll content, and its
  // height varies with insets/font scale — so the scroll's bottom padding is
  // measured from the footer itself instead of a guessed constant. Otherwise
  // the last card (How it works) ends up hidden behind the opaque footer.
  const [footerHeight, setFooterHeight] = useState(180);

  // router.back() throws "GO_BACK not handled" when onboarding has no prior
  // screen in the stack (e.g. opened directly, no back history yet) — fall
  // back to the home tab so the action always lands somewhere.
  function goToMain() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  function explore() {
    goToMain();
  }

  function signIn() {
    router.push("/(auth)/login");
  }

  function onScroll(e) {
    const y = e.nativeEvent.contentOffset.y;
    const shouldBeDark = heroHeight > 0 && y > heroHeight - insets.top - 12;
    setPastHero((prev) => (prev !== shouldBeDark ? shouldBeDark : prev));
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingBottom: footerHeight + spacing.lg }}
      >
        {/* ── Hero ───────────────────────────────────────────────── */}
        <View
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
          onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
        >
          <Pressable onPress={goToMain} hitSlop={10} style={[styles.closeBtn, { top: insets.top + spacing.md }]}>
            <Ionicons name="close" size={20} color={colors.textOnInk} />
          </Pressable>
          <Logo size={30} light />
          <Txt color={colors.textOnInk} size={font.size.display} weight={font.weight.heavy} style={{ marginTop: spacing.xxl, lineHeight: 40 }}>
            Home services,{"\n"}done right.
          </Txt>
          <Txt color="rgba(255,255,255,0.72)" size={font.size.md} style={{ marginTop: spacing.md, lineHeight: 23 }}>
            AC, appliances, electrical & more - booked in minutes and delivered by India's most trusted crew of professionals.
          </Txt>

          {/* Stats */}
          <Row style={styles.stats}>
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.stat}>
                  <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.lg}>{s.value}</Txt>
                  <Txt color="rgba(255,255,255,0.6)" size={font.size.xs} style={{ marginTop: 2 }}>{s.label}</Txt>
                </View>
              </React.Fragment>
            ))}
          </Row>
        </View>

        {/* ── Services we offer ──────────────────────────────────── */}
        <View style={styles.section}>
          <Txt size={font.size.lg} weight={font.weight.bold}>Everything we fix</Txt>
          <Txt muted size={font.size.sm} style={{ marginTop: 4, marginBottom: spacing.lg }}>
            One app for all your home & appliance repairs.
          </Txt>
          <View style={styles.grid}>
            {SERVICES.map((s) => (
              <View key={s.key} style={styles.serviceCell}>
                <CategoryTile category={s.key} iconSize={30} style={styles.serviceIcon} />
                <Txt size={font.size.xs} weight={font.weight.semibold} center numberOfLines={1}>{s.label}</Txt>
              </View>
            ))}
          </View>
        </View>

        {/* ── Why EliteCrew ──────────────────────────────────────── */}
        <View style={[styles.section, { paddingTop: spacing.xxxl }]}>
          <Txt size={font.size.lg} weight={font.weight.bold} style={{ marginBottom: spacing.lg }}>Why EliteCrew?</Txt>

          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            {WHY.map((w) => (
              <Card key={w.title} elevated={false}>
                <Row gap={spacing.md} align="center">
                  <View style={styles.whyIcon}>
                    <Ionicons name={w.icon} size={18} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight={font.weight.semibold} size={font.size.md} numberOfLines={1}>{w.title}</Txt>
                    <Txt muted size={font.size.sm} numberOfLines={1} style={{ marginTop: 2 }}>{w.sub}</Txt>
                  </View>
                </Row>
              </Card>
            ))}
          </View>

          {/* How it works */}
          <Card elevated={false}>
            <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>How it works</Txt>
            {HOW.map((step, i) => (
              <Row key={i} gap={spacing.md} style={{ marginBottom: i < HOW.length - 1 ? spacing.md : 0 }}>
                <View style={styles.stepNum}><Txt color={colors.textOnInk} size={font.size.xs} weight={font.weight.bold}>{i + 1}</Txt></View>
                <Txt size={font.size.sm} weight={font.weight.medium} style={{ flex: 1 }}>{step}</Txt>
              </Row>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* ── Sticky CTA ─────────────────────────────────────────── */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <Button title="Explore services" onPress={explore} rightIcon="arrow-forward" />
        {!user ? (
          <>
            <Pressable onPress={signIn} style={styles.signInLink} hitSlop={8}>
              <Txt muted size={font.size.sm}>Already a member? <Txt weight={font.weight.semibold} color={colors.ink}>Sign in</Txt></Txt>
            </Pressable>
            <Txt faint center size={font.size.xs} style={{ marginTop: 2 }}>No account needed to browse - sign in only when you book.</Txt>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    ...shadow.lifted,
  },
  closeBtn: {
    position: "absolute", right: spacing.xl, zIndex: 1,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  stats: { marginTop: spacing.xxl, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radii.lg, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.16)" },

  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  serviceCell: { width: "31%", alignItems: "center", gap: 8 },
  serviceIcon: { width: "100%", aspectRatio: 1 },

  whyIcon: {
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center", ...shadow.soft,
  },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },

  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    ...shadow.card,
  },
  signInLink: { alignItems: "center", paddingTop: spacing.md, paddingBottom: 2 },
});
