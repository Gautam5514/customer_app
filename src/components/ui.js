import React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, font, shadow } from "../theme";

// ─── Text ────────────────────────────────────────────────────────────────────
export function Txt({ style, weight, size, color, muted, faint, center, children, ...rest }) {
  return (
    <Text
      {...rest}
      style={[
        {
          color: color || (faint ? colors.textFaint : muted ? colors.textMuted : colors.text),
          fontSize: size || font.size.base,
          fontWeight: weight || font.weight.regular,
          textAlign: center ? "center" : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({
  title,
  onPress,
  variant = "primary", // primary | secondary | ghost | danger
  size = "lg", // lg | md | sm
  loading = false,
  disabled = false,
  icon = null, // leading emoji/glyph
  rightIcon = null, // trailing Ionicons name, e.g. "arrow-forward"
  style,
  fullWidth = true,
}) {
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, paddingVertical: s.py, borderRadius: radii.md },
        fullWidth && { alignSelf: "stretch" },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.992 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Text style={{ fontSize: s.fs + 1 }}>{icon}</Text> : null}
          <Text style={{ color: v.fg, fontSize: s.fs, fontWeight: font.weight.semibold, letterSpacing: 0.2 }}>
            {title}
          </Text>
          {rightIcon ? <Ionicons name={rightIcon} size={s.fs + 2} color={v.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const BTN_VARIANTS = {
  primary: { bg: colors.ink, fg: colors.textOnInk, border: colors.ink },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.borderStrong },
  ghost: { bg: "transparent", fg: colors.ink, border: "transparent" },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
};
const BTN_SIZES = {
  lg: { py: 15, fs: font.size.md },
  md: { py: 12, fs: font.size.base },
  sm: { py: 8, fs: font.size.sm },
};

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress, padded = true, elevated = true }) {
  const inner = (
    <View
      style={[
        styles.card,
        padded && { padding: spacing.lg },
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.95, transform: [{ scale: 0.995 }] }}>
        {inner}
      </Pressable>
    );
  return inner;
}

// ─── Input ───────────────────────────────────────────────────────────────────
// `right` renders inside the field on the right (e.g. a show/hide-password eye).
export function Input({ label, error, style, hint, right, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? (
        <Text style={styles.inputLabel}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          focused && { borderColor: colors.ink, backgroundColor: colors.surface },
          error && { borderColor: colors.danger },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textFaint}
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[styles.input, style]}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {error ? (
        <Text style={styles.inputError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.inputHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// Ready-made show/hide-password field — same Input, with the eye toggle wired.
export function PasswordInput({ ...rest }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <Input
      {...rest}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
        </Pressable>
      }
    />
  );
}

// ─── Pill / Badge ────────────────────────────────────────────────────────────
const TONE_MAP = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  neutral: { bg: colors.surfaceSunken, fg: colors.textMuted },
  ink: { bg: colors.ink, fg: colors.textOnInk },
};

export function Pill({ label, tone = "neutral", style, dot = false }) {
  const t = TONE_MAP[tone] || TONE_MAP.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.pillDot, { backgroundColor: t.fg }]} /> : null}
      <Text style={{ color: t.fg, fontSize: font.size.xs, fontWeight: font.weight.semibold, letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Chip (selectable) ───────────────────────────────────────────────────────
export function Chip({ label, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: colors.ink, borderColor: colors.ink } : { borderColor: colors.borderStrong },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={{ color: selected ? colors.textOnInk : colors.text, fontWeight: font.weight.medium, fontSize: font.size.sm }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Divider / Row ───────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

export function Row({ children, style, gap = spacing.sm, align = "center", justify }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: align, justifyContent: justify, gap }, style]}>
      {children}
    </View>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, emoji = "✨", title, subtitle, action }) {
  return (
    <View style={styles.empty}>
      {icon ? (
        <View style={styles.emptyIcon}>
          <Ionicons name={icon} size={32} color={colors.textMuted} />
        </View>
      ) : (
        <Text style={{ fontSize: 44, marginBottom: spacing.md }}>{emoji}</Text>
      )}
      <Txt size={font.size.lg} weight={font.weight.semibold} center>{title}</Txt>
      {subtitle ? (
        <Txt muted center style={{ marginTop: 6, lineHeight: 21, maxWidth: 280 }}>{subtitle}</Txt>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xl, alignSelf: "stretch", paddingHorizontal: spacing.xxl }}>{action}</View> : null}
    </View>
  );
}

// ─── Loading (branded) ───────────────────────────────────────────────────────
// EliteCrew signature loader: the logo mark inside a thin spinning gold arc.
// The web app renders the identical design (components/BrandLoader.jsx) so the
// brand feels the same on every surface.
const BRAND_MARK = require("../../assets/elitecrew-logo.png");

export function BrandSpinner({ size = 64 }) {
  const spin = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: colors.border,
          borderTopColor: colors.gold,
          transform: [{ rotate }],
        }}
      />
      <Image source={BRAND_MARK} style={{ width: size * 0.48, height: size * 0.48 }} resizeMode="contain" />
    </View>
  );
}

export function Loading({ label }) {
  return (
    <View style={styles.loading}>
      <BrandSpinner />
      {label ? (
        <Txt muted size={font.size.sm} weight={font.weight.semibold} style={{ marginTop: spacing.lg, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

// ─── Skeleton (loading placeholder) ──────────────────────────────────────────
// Gentle pulse — reads premium next to a bare spinner. Flat block, no shimmer
// gradient (keeps the flat design language and avoids extra deps).
export function Skeleton({ width = "100%", height = 14, radius = radii.sm, style }) {
  const opacity = React.useRef(new Animated.Value(0.45)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken, opacity }, style]}
    />
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
// Full-bleed friendly failure with a retry action — never leave a blank screen.
export function ErrorState({
  title = "Something went wrong",
  subtitle = "Check your internet connection and try again.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.textMuted} />
      </View>
      <Txt size={font.size.lg} weight={font.weight.semibold} center>{title}</Txt>
      <Txt muted center style={{ marginTop: 6, lineHeight: 21, maxWidth: 280 }}>{subtitle}</Txt>
      {onRetry ? (
        <View style={{ marginTop: spacing.xl, minWidth: 180 }}>
          <Button title={retryLabel} size="md" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.md }}>
      <Txt size={font.size.lg} weight={font.weight.bold}>{title}</Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Txt color={colors.ink} weight={font.weight.semibold} size={font.size.sm}>{action}</Txt>
        </Pressable>
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  inputLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: font.size.md,
    color: colors.text,
  },
  inputRight: { paddingRight: spacing.lg },
  inputError: { color: colors.danger, fontSize: font.size.xs, marginTop: 6, fontWeight: font.weight.medium },
  inputHint: { color: colors.textFaint, fontSize: font.size.xs, marginTop: 6 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, alignSelf: "flex-start" },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill, borderWidth: 1, backgroundColor: colors.surface },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  loading: { paddingVertical: 60, alignItems: "center", justifyContent: "center" },
});
