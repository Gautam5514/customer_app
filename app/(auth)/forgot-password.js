import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, PasswordInput, Txt, Row } from "../../src/components/ui";
import { Logo } from "../../src/components/Logo";
import { api, apiError } from "../../src/lib/api";
import { colors, spacing, font, radii } from "../../src/theme";

// 3-step recovery: email → 6-digit code + new password → done.
// Uses POST /auth/forgot-password and POST /auth/reset-password.
const STEPS = ["email", "reset", "done"];
const RESEND_SECONDS = 60; // server enforces a 60s gap between codes

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState(null);

  // Resend cooldown — matches the server's 60-second rule so the user never
  // hits a confusing "wait 60 seconds" error.
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const stepIndex = STEPS.indexOf(step);

  async function sendCode() {
    if (loading || cooldown > 0) return;
    setError(null);
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: em });
      // The token is only issued when the account exists; we advance either way
      // so the flow never reveals whether an email is registered.
      setVerificationToken(data.verificationToken || null);
      setCooldown(RESEND_SECONDS);
      setStep("reset");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (loading) return;
    setError(null);
    if (otp.length !== 6) return setError("Enter the 6-digit code from your email.");
    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      return setError("Password needs 8+ characters with upper, lower & a number.");
    if (!verificationToken)
      return setError("Code invalid or expired. Tap Resend to get a new one.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { verificationToken, otp, newPassword });
      setStep("done");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === "email" || step === "done") {
      router.canGoBack() ? router.back() : router.replace("/(auth)/login");
    } else {
      setStep("email");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>

        {/* Progress */}
        <Row gap={6} style={{ marginBottom: spacing.xl }}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progress, { backgroundColor: i <= stepIndex ? colors.ink : colors.border }]} />
          ))}
        </Row>

        <Logo size={32} />

        {step === "email" && (
          <View style={{ marginTop: spacing.xl }}>
            <Txt size={font.size.xxl} weight={font.weight.heavy}>Reset your password</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xl }}>
              Enter your account email and we'll send a 6-digit reset code.
            </Txt>
            <Input
              label="Email"
              placeholder="you@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              autoFocus
              onSubmitEditing={sendCode}
              returnKeyType="send"
            />
            <ErrorNote error={error} />
            <Button title="Send reset code" onPress={sendCode} loading={loading} />
          </View>
        )}

        {step === "reset" && (
          <View style={{ marginTop: spacing.xl }}>
            <Txt size={font.size.xxl} weight={font.weight.heavy}>Check your email</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xl }}>
              If an account exists for {email.trim()}, a code is on its way.
            </Txt>
            <Input
              label="6-digit code"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
              autoFocus
              style={{ fontSize: 24, letterSpacing: 8, textAlign: "center", fontWeight: "700" }}
            />
            <PasswordInput
              label="New password"
              placeholder="8+ chars, upper, lower & number"
              autoComplete="new-password"
              value={newPassword}
              onChangeText={setNewPassword}
              hint="At least 8 characters with a capital letter and a number."
            />
            <ErrorNote error={error} />
            <Button title="Reset password" onPress={resetPassword} loading={loading} />
            <Pressable
              onPress={sendCode}
              disabled={cooldown > 0 || loading}
              style={{ alignItems: "center", paddingVertical: spacing.lg }}
              hitSlop={8}
            >
              {cooldown > 0 ? (
                <Txt faint>Resend code in {cooldown}s</Txt>
              ) : (
                <Txt muted>Didn't get it? <Txt weight={font.weight.semibold} color={colors.ink}>Resend</Txt></Txt>
              )}
            </Pressable>
          </View>
        )}

        {step === "done" && (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={30} color={colors.success} />
            </View>
            <Txt size={font.size.xxl} weight={font.weight.heavy}>Password updated</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xxl }}>
              Your password has been reset. Sign in with your new password.
            </Txt>
            <Button title="Back to sign in" onPress={() => router.replace("/(auth)/login")} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Txt color={colors.danger} size={font.size.sm} style={{ flex: 1 }}>{error}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  back: { marginBottom: spacing.md, width: 36, height: 36, justifyContent: "center" },
  progress: { flex: 1, height: 4, borderRadius: radii.pill },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  doneIcon: {
    width: 64, height: 64, borderRadius: radii.xl, backgroundColor: colors.successSoft,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
});
