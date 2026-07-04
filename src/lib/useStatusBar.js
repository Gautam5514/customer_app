import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";

// Screens with a dark (ink) header need light status-bar content so the phone's
// clock, battery and signal icons stay visible. We flip to "light" while the
// screen is focused and reset to the app default ("dark") on blur, so the next
// (light-background) screen gets readable dark icons again.
//
//   useLightStatusBar();          // always light (dark-header screens)
//   useLightStatusBar(!!user);    // light only when condition holds
export function useLightStatusBar(active = true) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(active ? "light" : "dark", true);
      return () => setStatusBarStyle("dark", true);
    }, [active])
  );
}
