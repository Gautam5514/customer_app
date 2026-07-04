import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Button } from "./ui";
import { colors, spacing, font, radii } from "../theme";

// Shown on personal tabs (bookings, alerts, profile) when the visitor is
// browsing as a guest. Keeps the browse-first flow intact while nudging
// sign-in only where a session is actually required.
export function SignInPrompt({
  icon = "lock-closed-outline",
  title = "Sign in to continue",
  subtitle = "Create an account or sign in to book services and track them here.",
}) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={40} color={colors.ink} />
      </View>
      <Txt size={font.size.xl} weight={font.weight.heavy} center style={{ marginTop: spacing.lg }}>
        {title}
      </Txt>
      <Txt muted center style={{ marginTop: 8, lineHeight: 22, maxWidth: 300 }}>
        {subtitle}
      </Txt>
      <View style={styles.actions}>
        <Button title="Sign in" onPress={() => router.push("/(auth)/login")} />
        <Button
          title="Create account"
          variant="secondary"
          onPress={() => router.push("/(auth)/register")}
          style={{ marginTop: spacing.md }}
        />
      </View>
      <View style={styles.note}>
        <Ionicons name="eye-outline" size={15} color={colors.textFaint} />
        <Txt faint size={font.size.sm}>You can keep browsing all services without an account.</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl, paddingBottom: 60 },
  badge: {
    width: 88, height: 88, borderRadius: radii.xl,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  actions: { alignSelf: "stretch", marginTop: spacing.xxl },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xl },
});
