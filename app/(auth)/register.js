import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, PasswordInput, Txt, Row } from "../../src/components/ui";
import { Logo } from "../../src/components/Logo";
import { useAuth } from "../../src/store/auth";
import { api, apiError } from "../../src/lib/api";
import { colors, spacing, font, radii } from "../../src/theme";

// 3-step OTP registration: email → 6-digit code → profile + password.
const STEPS = ["email", "otp", "details"];
const RESEND_SECONDS = 60; // server enforces a 60s gap between codes

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeRegister } = useAuth();

  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Resend cooldown — mirrors the server's 60-second rule so the user never
  // hits a confusing "wait 60 seconds" error.
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const stepIndex = STEPS.indexOf(step);

  async function sendOtp() {
    if (loading || cooldown > 0) return;
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/send-register-otp", { email: email.trim() });
      setVerificationToken(data.verificationToken);
      setCooldown(RESEND_SECONDS);
      setStep("otp");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (loading) return;
    setError(null);
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-register-otp", { verificationToken, otp });
      setEmailVerificationToken(data.emailVerificationToken);
      setStep("details");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    if (loading) return;
    setError(null);
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!/^\d{10}$/.test(phone)) return setError("Phone must be exactly 10 digits.");
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return setError("Password needs 8+ chars with upper, lower & a number.");
    setLoading(true);
    try {
      await completeRegister({
        fullName: fullName.trim(),
        email: email.trim(),
        phone,
        password,
        role: "customer",
        emailVerificationToken,
      });
      // Root navigator routes into tabs once the session is set.
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === "email") router.back();
    else setStep(STEPS[stepIndex - 1]);
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
            <Txt size={font.size.xxl} weight={font.weight.heavy}>What's your email?</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xl }}>We'll send a 6-digit code to verify it.</Txt>
            <Input
              label="Email"
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoFocus
            />
            {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginBottom: spacing.md }}>{error}</Txt> : null}
            <Button title="Send code" onPress={sendOtp} loading={loading} />
          </View>
        )}

        {step === "otp" && (
          <View style={{ marginTop: spacing.xl }}>
            <Txt size={font.size.xxl} weight={font.weight.heavy}>Enter the code</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xl }}>Sent to {email}.</Txt>
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
            {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginBottom: spacing.md }}>{error}</Txt> : null}
            <Button title="Verify" onPress={verifyOtp} loading={loading} />
            <Pressable
              onPress={sendOtp}
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

        {step === "details" && (
          <View style={{ marginTop: spacing.xl }}>
            <Txt size={font.size.xxl} weight={font.weight.heavy}>Almost there</Txt>
            <Txt muted style={{ marginTop: 6, marginBottom: spacing.xl }}>Set up your profile.</Txt>
            <Input label="Full name" placeholder="Your name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Input label="Phone" placeholder="10-digit number" keyboardType="number-pad" maxLength={10} value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, ""))} />
            <PasswordInput label="Password" placeholder="8+ chars, upper, lower & number" autoComplete="new-password" value={password} onChangeText={setPassword} hint="At least 8 characters with a capital letter and a number." />
            {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginBottom: spacing.md }}>{error}</Txt> : null}
            <Button title="Create account" onPress={finish} loading={loading} />
          </View>
        )}

        {step === "email" && (
          <Pressable onPress={() => router.replace("/(auth)/login")} style={{ alignItems: "center", paddingVertical: spacing.xl }} hitSlop={8}>
            <Txt muted center>Already have an account? <Txt weight={font.weight.semibold} color={colors.ink}>Sign in</Txt></Txt>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  back: { marginBottom: spacing.md, width: 36, height: 36, justifyContent: "center" },
  progress: { flex: 1, height: 4, borderRadius: radii.pill },
});
