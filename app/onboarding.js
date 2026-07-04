import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "../src/components/Logo";
import { CategoryIcon } from "../src/components/CategoryIcon";
import { Button, Txt, Row, Card } from "../src/components/ui";
import { markIntroSeen } from "../src/lib/onboarding";
import { useLightStatusBar } from "../src/lib/useStatusBar";
import { colors, spacing, font, radii, shadow, categoryMeta } from "../src/theme";

// First-launch landing — explains what EliteCrew does, why to use it and every
// service on offer, then lets the visitor explore freely (no login required).
// Login is only ever requested later, at the moment of booking.

const SERVICES = [
  { key: "ac", label: "AC Repair & Service" },
  { key: "fridge", label: "Refrigerator" },
  { key: "cooler", label: "Air Cooler" },
  { key: "fan", label: "Fan & Motor" },
  { key: "tv", label: "Television" },
  { key: "electrical", label: "Electrician" },
  { key: "appliance", label: "Appliances" },
];

const WHY = [
  { icon: "shield-checkmark", title: "Verified professionals", sub: "Background-checked, trained & rated experts at your door." },
  { icon: "pricetag", title: "Upfront, honest pricing", sub: "See the full quote before you book — zero surprises." },
  { icon: "flash", title: "Same-day service", sub: "Book in under a minute and get sorted today." },
  { icon: "refresh", title: "30-day warranty", sub: "Every job is backed by our service guarantee." },
];

const STATS = [
  { value: "4.8★", label: "Avg rating" },
  { value: "50k+", label: "Jobs done" },
  { value: "100%", label: "Verified" },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLightStatusBar(); // dark hero → light clock/battery icons

  async function explore() {
    await markIntroSeen();
    router.replace("/(tabs)");
  }

  async function signIn() {
    await markIntroSeen();
    router.push("/(auth)/login");
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <Logo size={30} light />
          <Txt color={colors.textOnInk} size={font.size.display} weight={font.weight.heavy} style={{ marginTop: spacing.xxl, lineHeight: 40 }}>
            Home services,{"\n"}done right.
          </Txt>
          <Txt color="rgba(255,255,255,0.72)" size={font.size.md} style={{ marginTop: spacing.md, lineHeight: 23 }}>
            AC, appliances, electrical & more — booked in minutes and delivered by India's most trusted crew of professionals.
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
                <View style={[styles.serviceIcon, { backgroundColor: categoryMeta[s.key]?.tint || colors.surfaceAlt, borderColor: "transparent" }]}>
                  <CategoryIcon category={s.key} size={26} />
                </View>
                <Txt size={font.size.xs} weight={font.weight.semibold} center numberOfLines={2}>{s.label}</Txt>
              </View>
            ))}
          </View>
        </View>

        {/* ── Why EliteCrew ──────────────────────────────────────── */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <Txt size={font.size.lg} weight={font.weight.bold} style={{ marginBottom: spacing.lg }}>Why EliteCrew?</Txt>
          {WHY.map((w) => (
            <Row key={w.title} gap={spacing.md} align="flex-start" style={{ marginBottom: spacing.lg }}>
              <View style={styles.whyIcon}><Ionicons name={w.icon} size={20} color={colors.ink} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.semibold} size={font.size.md}>{w.title}</Txt>
                <Txt muted size={font.size.sm} style={{ marginTop: 2, lineHeight: 20 }}>{w.sub}</Txt>
              </View>
            </Row>
          ))}

          {/* How it works */}
          <Card style={{ marginTop: spacing.sm }}>
            <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>How it works</Txt>
            {[
              "Browse services & see upfront prices",
              "Pick a time slot that suits you",
              "Sit back — pay only after the job's done",
            ].map((step, i) => (
              <Row key={i} gap={spacing.md} style={{ marginBottom: i < 2 ? spacing.md : 0 }}>
                <View style={styles.stepNum}><Txt color={colors.textOnInk} size={font.size.xs} weight={font.weight.bold}>{i + 1}</Txt></View>
                <Txt size={font.size.sm} weight={font.weight.medium} style={{ flex: 1 }}>{step}</Txt>
              </Row>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* ── Sticky CTA ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title="Explore services" onPress={explore} />
        <Pressable onPress={signIn} style={styles.signInLink} hitSlop={8}>
          <Txt muted size={font.size.sm}>Already a member? <Txt weight={font.weight.semibold} color={colors.ink}>Sign in</Txt></Txt>
        </Pressable>
        <Txt faint center size={font.size.xs} style={{ marginTop: 2 }}>No account needed to browse — sign in only when you book.</Txt>
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
    borderBottomLeftRadius: radii.xl + 6,
    borderBottomRightRadius: radii.xl + 6,
  },
  stats: { marginTop: spacing.xxl, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radii.lg, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.16)" },

  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  serviceCell: { width: "22%", alignItems: "center", gap: 8 },
  serviceIcon: {
    width: "100%", aspectRatio: 1, borderRadius: radii.lg, backgroundColor: colors.surfaceAlt,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border,
  },

  whyIcon: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },

  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    ...shadow.card,
  },
  signInLink: { alignItems: "center", paddingTop: spacing.md, paddingBottom: 2 },
});
