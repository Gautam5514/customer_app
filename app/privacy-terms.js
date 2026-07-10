import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card } from "../src/components/ui";
import { colors, spacing, font, radii } from "../src/theme";

// Condensed, honest summary of the same policies published on the website.
const SECTIONS = [
  {
    icon: "person-outline",
    title: "What we collect",
    points: [
      "Your name, phone, email and saved addresses — to create bookings and send updates.",
      "Service address and optional GPS location — to match nearby professionals accurately.",
      "Booking history and ratings — to improve matching and service quality.",
    ],
  },
  {
    icon: "shield-checkmark-outline",
    title: "How we protect it",
    points: [
      "Payments are processed by Razorpay — we never see or store your card or UPI details.",
      "Your session is stored securely on this device and can be ended anytime by signing out.",
      "Professionals see your address only after a booking is confirmed to them.",
    ],
  },
  {
    icon: "document-text-outline",
    title: "Booking terms",
    points: [
      "Prices shown are upfront; the final amount is confirmed before you pay.",
      "Free cancellation any time before the professional starts the job.",
      "Completed work is covered by a 30-day service warranty.",
      "Disputes are reviewed by support within 24 hours.",
    ],
  },
  {
    icon: "mail-outline",
    title: "Your choices",
    points: [
      "Ask for a copy or correction of your data at support@elitecrew.in.",
      "Request account deletion anytime — we remove personal data not legally required for invoices.",
    ],
  },
];

export default function PrivacyTerms() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Privacy & terms" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="lock-closed" size={20} color={colors.gold} /></View>
          <View style={{ flex: 1 }}>
            <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>Your data, your control</Txt>
            <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginTop: 1 }}>
              The short version of our policies — full text at elitecrew.in
            </Txt>
          </View>
        </View>

        <Card padded={false} style={{ overflow: "hidden", marginTop: spacing.lg }}>
          {SECTIONS.map((s, i) => {
            const isOpen = open === i;
            return (
              <View key={s.title} style={i < SECTIONS.length - 1 ? styles.rowBorder : null}>
                <Pressable
                  onPress={() => setOpen(isOpen ? null : i)}
                  style={({ pressed }) => [styles.head, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  <View style={styles.headIcon}><Ionicons name={s.icon} size={17} color={colors.ink} /></View>
                  <Txt weight={font.weight.semibold} style={{ flex: 1 }}>{s.title}</Txt>
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textFaint} />
                </Pressable>
                {isOpen ? (
                  <View style={styles.body}>
                    {s.points.map((p, j) => (
                      <Row key={j} gap={spacing.sm} align="flex-start" style={{ marginBottom: j < s.points.length - 1 ? spacing.sm : 0 }}>
                        <Ionicons name="checkmark-circle" size={15} color={colors.success} style={{ marginTop: 2 }} />
                        <Txt muted size={font.size.sm} style={{ flex: 1, lineHeight: 20 }}>{p}</Txt>
                      </Row>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>

        <Txt faint center size={font.size.xs} style={{ marginTop: spacing.xl }}>
          Full Privacy Policy and Terms of Service: elitecrew.in/privacy · elitecrew.in/terms
        </Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, borderRadius: radii.xl, padding: spacing.lg,
  },
  heroIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  headIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
