// App-wide "where am I" state, persisted so we only ever ask once.
// `asked` records that the first-launch prompt has been shown (whether the
// user picked a spot or skipped) — so we never nag on later opens.
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getCurrentCoords, reverseGeocode } from "../lib/places";

const LOC_KEY = "elitecrew_location";
const ASKED_KEY = "elitecrew_location_asked";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null); // { lat, lng, fullAddress, city, pincode, source }
  const [asked, setAsked] = useState(true); // assume asked until hydrated (avoid a flash)
  const [ready, setReady] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawLoc, rawAsked] = await Promise.all([
          SecureStore.getItemAsync(LOC_KEY),
          SecureStore.getItemAsync(ASKED_KEY),
        ]);
        if (rawLoc) setLocationState(JSON.parse(rawLoc));
        setAsked(rawAsked === "1");
      } catch {
        setAsked(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Auto-detect on every app open (UC-style): once hydrated, silently pull the
  // real GPS position — the OS permission prompt appears here if needed. A
  // location the user picked by hand (source:"manual") is never overridden;
  // GPS-sourced ones just refresh. On failure (denied / services off) we leave
  // state untouched so the existing first-launch picker prompt takes over.
  useEffect(() => {
    if (!ready) return;
    if (location?.source === "manual") return;
    let cancelled = false;
    (async () => {
      setDetecting(true);
      try {
        const { lat, lng } = await getCurrentCoords();
        const addr = await reverseGeocode(lat, lng);
        if (!cancelled) await setLocation({ lat, lng, ...addr, source: "gps" });
      } catch {
        // denied or unavailable — the manual picker remains the fallback
      } finally {
        if (!cancelled) setDetecting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  async function setLocation(loc) {
    setLocationState(loc);
    await markAsked();
    try {
      await SecureStore.setItemAsync(LOC_KEY, JSON.stringify(loc));
    } catch {}
  }

  async function markAsked() {
    setAsked(true);
    try {
      await SecureStore.setItemAsync(ASKED_KEY, "1");
    } catch {}
  }

  // Should the first-launch picker auto-open? Only when hydrated, never asked,
  // nothing on file yet, and auto-detection isn't still in flight (it usually
  // resolves by itself and no prompt is needed at all).
  const shouldPrompt = ready && !asked && !location && !detecting;

  return (
    <LocationContext.Provider value={{ location, setLocation, markAsked, ready, shouldPrompt, detecting }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
