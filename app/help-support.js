import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card } from "../src/components/ui";
import { colors, spacing, font, radii } from "../src/theme";

const CHANNELS = [
  {
    icon: "mail-outline",
    title: "Email support",
    sub: "support@elitecrew.in · replies within 24 hrs",
    onPress: () => Linking.openURL("mailto:support@elitecrew.in"),
  },
  {
    icon: "logo-whatsapp",
    title: "WhatsApp us",
    sub: "Quickest for an active booking",
    onPress: () => Linking.openURL("https://wa.me/918765434546"),
  },
];

const FAQS = [
  {
    q: "Where is my professional?",
    a: "Open the booking from My Bookings — you'll see live status, and once they're on the way, their live location on the map. You can also call them directly from the booking page.",
  },
  {
    q: "What is the 4-digit PIN in my booking?",
    a: "It's your safety code. Share it with the professional only when they arrive — they enter it to start the job, which confirms the right person is at your door.",
  },
  {
    q: "How do I pay?",
    a: "Choose Pay online (UPI, cards, netbanking — secured by Razorpay) when booking, or Cash on delivery and pay after the job is completed.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes — free any time before the professional starts the job, right from the booking page. Once work is in progress, raise an issue instead so support can help.",
  },
  {
    q: "Something went wrong with my service.",
    a: "Open the booking and use 'Raise an issue' — our team reviews every dispute within 24 hours. Completed work is covered by a 30-day service warranty.",
  },
];

export default function HelpSupport() {
  const router = useRouter();
  const [open, setOpen] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Help & support" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="headset" size={20} color={colors.gold} /></View>
          <View style={{ flex: 1 }}>
            <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>How can we help?</Txt>
            <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginTop: 1 }}>
              Real people, 7 days a week
            </Txt>
          </View>
        </View>

        {/* Quick action for booking problems */}
        <Pressable
          onPress={() => router.push("/(tabs)/bookings")}
          style={({ pressed }) => [styles.quick, pressed && { backgroundColor: colors.surfaceAlt }]}
        >
          <View style={styles.channelIcon}><Ionicons name="receipt-outline" size={19} color={colors.ink} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.semibold}>Issue with a booking?</Txt>
            <Txt muted size={font.size.sm} style={{ marginTop: 1 }}>Open the booking to track, call or raise an issue</Txt>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>

        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Contact us</Txt>
        <Card padded={false} style={{ overflow: "hidden" }}>
          {CHANNELS.map((c, i) => (
            <Pressable
              key={c.title}
              onPress={c.onPress}
              style={({ pressed }) => [styles.channel, i < CHANNELS.length - 1 && styles.channelBorder, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <View style={styles.channelIcon}><Ionicons name={c.icon} size={19} color={colors.ink} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.semibold}>{c.title}</Txt>
                <Txt muted size={font.size.sm} style={{ marginTop: 1 }}>{c.sub}</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </Card>

        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Common questions</Txt>
        <Card padded={false} style={{ overflow: "hidden" }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <View key={f.q} style={i < FAQS.length - 1 ? styles.channelBorder : null}>
                <Pressable
                  onPress={() => setOpen(isOpen ? null : i)}
                  style={({ pressed }) => [styles.faqHead, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Txt weight={font.weight.semibold} size={font.size.sm} style={{ flex: 1, paddingRight: spacing.md }}>{f.q}</Txt>
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textFaint} />
                </Pressable>
                {isOpen ? (
                  <Txt muted size={font.size.sm} style={styles.faqBody}>{f.a}</Txt>
                ) : null}
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, borderRadius: radii.xl, padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  quick: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.lg, backgroundColor: colors.surface,
  },
  label: { marginTop: spacing.xl, marginBottom: spacing.md },
  channel: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  channelBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  channelIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  faqHead: { flexDirection: "row", alignItems: "center", padding: spacing.lg },
  faqBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, lineHeight: 20 },
});
