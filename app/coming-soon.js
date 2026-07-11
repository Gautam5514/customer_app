import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt } from "../src/components/ui";
import { colors, spacing, font, radii, shadow } from "../src/theme";

// A slow, expanding gold ring that fades as it grows — two of these, staggered,
// give the icon tile a calm "radar pulse" without any extra dependencies.
function PulseRing({ delay = 0, size = 120 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: colors.gold,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// A tiny gold sparkle that drifts up and down forever — placed loosely around
// the hero so the screen feels alive but stays restrained.
function FloatingSparkle({ style, size = 14, duration = 2600, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [4, -6] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.9, 0.35] });

  return (
    <Animated.View pointerEvents="none" style={[style, { position: "absolute", opacity, transform: [{ translateY }] }]}>
      <Ionicons name="sparkles" size={size} color={colors.gold} />
    </Animated.View>
  );
}

export default function ComingSoon() {
  const { title = "This feature", icon = "rocket-outline", blurb = "We're crafting this experience right now." } =
    useLocalSearchParams();
  const [notified, setNotified] = useState(false);

  // Gentle breathing float on the icon tile.
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={String(title)} />

      <View style={styles.body}>
        {/* Hero — pulsing rings behind a floating ink tile */}
        <View style={styles.hero}>
          <PulseRing size={120} />
          <PulseRing size={120} delay={1100} />
          <FloatingSparkle style={{ top: -6, right: 8 }} size={16} />
          <FloatingSparkle style={{ bottom: 4, left: -2 }} size={12} duration={3200} delay={600} />
          <Animated.View style={[styles.tile, { transform: [{ translateY }] }]}>
            <Ionicons name={String(icon)} size={40} color={colors.gold} />
          </Animated.View>
        </View>

        <Txt color={colors.gold} weight={font.weight.bold} size={font.size.xs} style={styles.eyebrow}>
          COMING SOON
        </Txt>
        <Txt size={font.size.display} weight={font.weight.heavy} center style={{ letterSpacing: -0.5 }}>
          {String(title)}
        </Txt>
        <Txt muted center size={font.size.md} style={styles.blurb}>
          {String(blurb)}
        </Txt>

        {/* Status strip — reads like a build in progress */}
        <View style={styles.statusStrip}>
          <View style={styles.statusDot} />
          <Txt size={font.size.sm} weight={font.weight.semibold} color={colors.success}>
            In the workshop
          </Txt>
          <View style={styles.statusDivider} />
          <Txt size={font.size.sm} muted>Launching in an upcoming update</Txt>
        </View>

        {/* Notify me — flips to a confirmation, no backend needed yet */}
        {notified ? (
          <View style={[styles.notifyBtn, styles.notifiedBtn]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Txt color={colors.success} weight={font.weight.bold} size={font.size.md}>
              You're on the list — we'll let you know
            </Txt>
          </View>
        ) : (
          <Pressable
            onPress={() => setNotified(true)}
            style={({ pressed }) => [styles.notifyBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.textOnInk} />
            <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>Notify me when it's live</Txt>
          </Pressable>
        )}

        <Txt faint center size={font.size.xs} style={{ marginTop: spacing.xl }}>
          Good things take a little polish ✦
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl, marginTop: -spacing.xxxl },

  hero: { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl },
  tile: {
    width: 92, height: 92, borderRadius: radii.xl, backgroundColor: colors.ink,
    alignItems: "center", justifyContent: "center",
    ...shadow.lifted,
  },

  eyebrow: { letterSpacing: 4, marginBottom: spacing.sm },
  blurb: { marginTop: spacing.sm, lineHeight: 23, maxWidth: 300 },

  statusStrip: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    marginTop: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusDivider: { width: 1, height: 14, backgroundColor: colors.borderStrong },

  notifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    marginTop: spacing.xxl, alignSelf: "stretch",
    backgroundColor: colors.ink, borderRadius: radii.md, paddingVertical: 16,
  },
  notifiedBtn: { backgroundColor: colors.successSoft },
});
