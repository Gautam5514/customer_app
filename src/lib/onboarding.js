import * as SecureStore from "expo-secure-store";

// Remembers whether the visitor has already seen the intro/landing screen so we
// only show the "about the app + services" walkthrough on the very first open.
const KEY = "elitecrew_seen_intro";

export async function hasSeenIntro() {
  try {
    return (await SecureStore.getItemAsync(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markIntroSeen() {
  try {
    await SecureStore.setItemAsync(KEY, "1");
  } catch {}
}
