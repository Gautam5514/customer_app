import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, PasswordInput, Txt } from "../../src/components/ui";
import { Logo } from "../../src/components/Logo";
import { useAuth } from "../../src/store/auth";
import { apiError } from "../../src/lib/api";
import { colors, spacing, font, radii } from "../../src/theme";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;
    setError(null);
    const em = email.trim();
    if (!em || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await signIn(em, password);
      // Root navigator redirects into tabs once the user is set.
    } catch (e) {
      setError(apiError(e, "Couldn't sign in. Check your details."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>

        <View style={{ marginBottom: spacing.xxl }}>
          <Logo size={34} />
          <Txt size={font.size.xxl} weight={font.weight.heavy} style={{ marginTop: spacing.xl }}>Welcome back</Txt>
          <Txt muted style={{ marginTop: 6 }}>Sign in to manage your bookings.</Txt>
        </View>

        <Input
          label="Email"
          placeholder="you@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        <Pressable onPress={() => router.push("/(auth)/forgot-password")} hitSlop={8} style={styles.forgot}>
          <Txt weight={font.weight.semibold} size={font.size.sm} color={colors.ink}>Forgot password?</Txt>
        </Pressable>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Txt color={colors.danger} size={font.size.sm} style={{ flex: 1 }}>{error}</Txt>
          </View>
        ) : null}

        <Button title="Sign in" onPress={onSubmit} loading={loading} />

        <Pressable onPress={() => router.replace("/(auth)/register")} style={styles.swap} hitSlop={8}>
          <Txt muted center>New to EliteCrew? <Txt weight={font.weight.semibold} color={colors.ink}>Create account</Txt></Txt>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  back: { marginBottom: spacing.lg, width: 36, height: 36, justifyContent: "center" },
  forgot: { alignSelf: "flex-end", marginTop: -spacing.sm, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  swap: { alignItems: "center", paddingVertical: spacing.xl },
});
