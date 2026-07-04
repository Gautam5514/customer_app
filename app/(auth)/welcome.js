import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "../../src/components/Logo";
import { Button, Txt, Row } from "../../src/components/ui";
import { useLightStatusBar } from "../../src/lib/useStatusBar";
import { colors, spacing, font, radii } from "../../src/theme";

const PERKS = [
  { icon: "shield-checkmark", title: "Verified professionals", sub: "Background-checked, rated experts" },
  { icon: "flash", title: "Same-day service", sub: "Book in minutes, sorted today" },
  { icon: "card", title: "Transparent pricing", sub: "Upfront quotes, no surprises" },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLightStatusBar(); // dark hero → light clock/battery icons

  return (
    <View style={styles.root}>
      {/* Dark hero */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
        <Row justify="space-between">
          <Logo size={40} light />
          {router.canGoBack() ? (
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.textOnInk} />
            </Pressable>
          ) : null}
        </Row>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Txt color={colors.textOnInk} size={font.size.display} weight={font.weight.heavy} style={{ lineHeight: 40 }}>
            Home services,{"\n"}done right.
          </Txt>
          <Txt color="rgba(255,255,255,0.7)" size={font.size.md} style={{ marginTop: spacing.md, lineHeight: 23 }}>
            AC, appliances, electrical & more — delivered by India's most trusted crew.
          </Txt>
        </View>
      </View>

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={{ gap: spacing.lg, marginBottom: spacing.xxl }}>
          {PERKS.map((p) => (
            <Row key={p.title} gap={spacing.md} align="center">
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon} size={19} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.semibold} size={font.size.md}>{p.title}</Txt>
                <Txt muted size={font.size.sm}>{p.sub}</Txt>
              </View>
            </Row>
          ))}
        </View>

        <Button title="Create account" onPress={() => router.push("/(auth)/register")} />
        <Pressable onPress={() => router.push("/(auth)/login")} style={styles.loginLink} hitSlop={8}>
          <Txt muted>Already a member? <Txt weight={font.weight.semibold} color={colors.ink}>Sign in</Txt></Txt>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl + 6,
    borderTopRightRadius: radii.xl + 6,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  perkIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center",
  },
  loginLink: { alignItems: "center", paddingVertical: spacing.lg },
  close: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
});
