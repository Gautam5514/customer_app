// App-wide "where am I" state, persisted so we only ever ask once.
// `asked` records that the first-launch prompt has been shown (whether the
// user picked a spot or skipped) — so we never nag on later opens.
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const LOC_KEY = "elitecrew_location";
const ASKED_KEY = "elitecrew_location_asked";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null); // { lat, lng, fullAddress, city, pincode }
  const [asked, setAsked] = useState(true); // assume asked until hydrated (avoid a flash)
  const [ready, setReady] = useState(false);

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
  // and we have nothing on file yet.
  const shouldPrompt = ready && !asked && !location;

  return (
    <LocationContext.Provider value={{ location, setLocation, markAsked, ready, shouldPrompt }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
