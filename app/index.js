import React from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/auth";
import { Logo } from "../src/components/Logo";
import { colors } from "../src/theme";

// Entry point. Everyone — guest or signed-in — lands straight on the browse
// experience (services first). The "what EliteCrew does / why us" walkthrough
// is one tap away from Home via "Explore EliteCrew", not a forced first step.
// Login is never forced here — only later, at booking time.
export default function Index() {
  const { booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <Logo size={56} light />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
