// Premium branded launch screen — shown while the app boots / restores session.
// Replaces the bare logo-on-black with an animated, considered first impression:
// a softly glowing emblem, the wordmark, a gold hairline, a tagline, and a
// restrained loading shimmer. Pure RN Animated (no extra deps).
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Txt } from "./ui";
import { colors, spacing, font } from "../theme";

const LOGO = require("../../assets/elitecrew-logo.png");

export function LaunchScreen({ tagline = "PREMIUM HOME SERVICES" }) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const lineW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(lineW, { toValue: 1, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    // Slow breathing glow behind the emblem.
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View style={styles.root}>
      {/* soft top vignette for depth */}
      <View style={styles.vignette} pointerEvents="none" />

      <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: rise }, { scale }] }]}>
        <View style={styles.emblemWrap}>
          <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
          <View style={styles.emblem}>
            <Image source={LOGO} style={{ width: 64, height: 64 }} contentFit="contain" />
          </View>
        </View>

        <Txt size={font.size.display} weight={font.weight.heavy} color={colors.textOnInk} style={{ marginTop: spacing.xl, letterSpacing: 0.4 }}>
          Elite<Txt size={font.size.display} weight={font.weight.heavy} color={colors.gold}>Crew</Txt>
        </Txt>

        <Animated.View style={[styles.rule, { width: lineW.interpolate({ inputRange: [0, 1], outputRange: [0, 54] }) }]} />

        <Txt size={font.size.xs} weight={font.weight.bold} color="rgba(255,255,255,0.55)" style={{ letterSpacing: 2.5, marginTop: spacing.md }}>
          {tagline}
        </Txt>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fade }]}>
        <ActivityIndicator color={colors.gold} />
        <Txt size={font.size.xs} color="rgba(255,255,255,0.4)" weight={font.weight.semibold} style={{ letterSpacing: 1.5, marginTop: spacing.md }}>
          GETTING THINGS READY
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  vignette: {
    position: "absolute", top: 0, left: 0, right: 0, height: "55%",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  center: { alignItems: "center" },
  emblemWrap: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute", width: 150, height: 150, borderRadius: 75,
    backgroundColor: colors.gold,
  },
  emblem: {
    width: 108, height: 108, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  rule: { height: 2, borderRadius: 1, backgroundColor: colors.gold, marginTop: spacing.lg, opacity: 0.9 },
  footer: { position: "absolute", bottom: 56, alignItems: "center" },
});
