import React from "react";
import { View, StyleSheet, Pressable, Text, Share } from "react-native";
import { Txt } from "./ui";
import { colors, spacing, font, radii } from "../theme";

// UC-style "Refer & earn" highlight card — deliberately purple (matches the
// reference design) even though the rest of the app is monochrome ink.
// Shared by the Account page and the Home feed.
const referPurple = "#6E42E2";
const referPurpleSoft = "#F6F1FB";

async function referNow() {
  try {
    await Share.share({
      message:
        "Get ₹100 off your first booking on EliteCrew! Use code ELITE100 at checkout. Download the app and book trusted home services in minutes.",
    });
  } catch {}
}

export function ReferEarnCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Txt size={font.size.xl} weight={font.weight.bold}>Refer & earn ₹100</Txt>
        <Txt muted size={font.size.base} style={{ marginTop: 6, lineHeight: 22 }}>
          Get ₹100 when your friend completes their first booking
        </Txt>
        <Pressable onPress={referNow} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}>
          <Txt color="#FFFFFF" weight={font.weight.bold} size={font.size.md}>Refer now</Txt>
        </Pressable>
      </View>
      <Text style={{ fontSize: 54 }}>🎁</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: referPurpleSoft, borderRadius: radii.md, padding: spacing.xl,
  },
  btn: {
    marginTop: spacing.lg, alignSelf: "flex-start", backgroundColor: referPurple,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: radii.sm,
  },
});
