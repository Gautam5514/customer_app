import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "../src/store/auth";
import { LocationProvider } from "../src/store/location";
import { takePostLogin } from "../src/lib/postLogin";
import { LaunchScreen } from "../src/components/LaunchScreen";
import { colors } from "../src/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// Browse-first navigation: guests roam the tabs freely (services are public).
// We only bounce a signed-in user *out* of the auth group once their session
// is set — resuming whatever they were trying to do before we asked them in.
function RootNavigator() {
  const { user, booting } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Hold the branded launch screen for a beat so the entrance animation is
  // actually seen, even when the session restores instantly.
  const [minSplash, setMinSplash] = React.useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMinSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (booting) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (user && inAuthGroup) {
      const next = takePostLogin();
      router.replace(next || "/(tabs)");
    }
  }, [user, booting, segments]);

  if (booting || minSplash) {
    return <LaunchScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[cat]" options={{ presentation: "card" }} />
      <Stack.Screen name="service/[slug]" options={{ presentation: "card" }} />
      <Stack.Screen name="booking/new" options={{ presentation: "card" }} />
      <Stack.Screen name="booking/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="addresses" options={{ presentation: "card" }} />
      <Stack.Screen name="help-support" options={{ presentation: "card" }} />
      <Stack.Screen name="offers" options={{ presentation: "card" }} />
      <Stack.Screen name="privacy-terms" options={{ presentation: "card" }} />
      <Stack.Screen name="rate/[bookingId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
