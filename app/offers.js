import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card, Button } from "../src/components/ui";
import { colors, spacing, font, radii } from "../src/theme";

// Static launch offers — codes are validated live at checkout, so an expired
// or exhausted code fails gracefully there with a clear message.
const OFFERS = [
  {
    code: "ELITE100",
    headline: "Flat ₹100 off",
    sub: "Your first booking, any service",
    terms: "New customers · one use per account",
  },
  {
    code: "FIRST50",
    headline: "Flat ₹50 off",
    sub: "Bookings above ₹499",
    terms: "Limited period · one use per account",
  },
  {
    code: "WELCOME10",
    headline: "10% off",
    sub: "Up to ₹150 on any service",
    terms: "Limited period · one use per account",
  },
];

const HOW = [
  { icon: "search-outline",    text: "Pick a service and reach checkout" },
  { icon: "pricetag-outline",  text: "Type the code in “Have a coupon?”" },
  { icon: "checkmark-circle-outline", text: "Discount applies instantly to your total" },
];

export default function Offers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Offers & coupons" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>

        {OFFERS.map((o, i) => (
          <Card key={o.code} padded={false} style={{ overflow: "hidden", marginBottom: spacing.md }}>
            <View style={styles.offerTop}>
              <View style={{ flex: 1 }}>
                <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.lg}>{o.headline}</Txt>
                <Txt color="rgba(255,255,255,0.7)" size={font.size.sm} style={{ marginTop: 1 }}>{o.sub}</Txt>
              </View>
              <View style={styles.codeChip}>
                <Ionicons name="pricetag" size={12} color={colors.gold} />
                <Txt color={colors.gold} weight={font.weight.bold} size={font.size.sm} style={{ letterSpacing: 1.5 }}>
                  {o.code}
                </Txt>
              </View>
            </View>
            <Row justify="space-between" style={styles.offerBottom}>
              <Txt faint size={font.size.xs}>{o.terms}</Txt>
              <Txt weight={font.weight.semibold} size={font.size.xs} color={colors.ink}>Apply at checkout</Txt>
            </Row>
          </Card>
        ))}

        {/* How to use */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>How to use a code</Txt>
        <Card>
          {HOW.map((h, i) => (
            <Row key={h.text} gap={spacing.md} style={{ marginBottom: i < HOW.length - 1 ? spacing.md : 0 }}>
              <View style={styles.howIcon}><Ionicons name={h.icon} size={16} color={colors.ink} /></View>
              <Txt size={font.size.sm} style={{ flex: 1 }}>{h.text}</Txt>
            </Row>
          ))}
        </Card>

        <Button title="Browse services" style={{ marginTop: spacing.xl }} onPress={() => router.push("/(tabs)")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  offerTop: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, padding: spacing.lg,
  },
  codeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "rgba(200,164,92,0.55)", borderStyle: "dashed",
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  offerBottom: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  label: { marginTop: spacing.lg, marginBottom: spacing.md },
  howIcon: { width: 32, height: 32, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
});
