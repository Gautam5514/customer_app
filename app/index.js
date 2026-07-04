import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/auth";
import { hasSeenIntro } from "../src/lib/onboarding";
import { Logo } from "../src/components/Logo";
import { colors } from "../src/theme";

// Entry point. First-time visitors see the intro/landing (what the app does +
// services). Returning guests and signed-in users go straight to the browse
// experience. Login is never forced here — only later, at booking time.
export default function Index() {
  const { user, booting } = useAuth();
  const [seenIntro, setSeenIntro] = useState(null);

  useEffect(() => {
    hasSeenIntro().then(setSeenIntro);
  }, []);

  if (booting || seenIntro === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <Logo size={56} light />
      </View>
    );
  }

  if (!user && !seenIntro) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
