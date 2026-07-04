// Full-screen location picker used everywhere an address is chosen.
// Two ways to set a spot, both feeding the same result:
//   • Manual  — Google Places search, or drag the map to move the center pin
//   • Auto    — "Use my current location" (GPS)
// onConfirm receives { lat, lng, fullAddress, city, pincode }.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, StyleSheet, Pressable, ActivityIndicator, FlatList,
  Keyboard, Platform, Alert,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt, Button, Input } from "./ui";
import { colors, spacing, font, radii } from "../theme";
import {
  DEFAULT_REGION, newSessionToken, searchPlaces, getPlaceDetails,
  reverseGeocode, getCurrentCoords,
} from "../lib/places";

export function LocationPicker({ initial, onConfirm, onClose }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const sessionRef = useRef(newSessionToken());
  const searchTimer = useRef(null);
  const geoTimer = useRef(null);
  const skipNextRegion = useRef(false); // ignore programmatic recenters

  const startRegion = initial?.lat
    ? { ...DEFAULT_REGION, latitude: initial.lat, longitude: initial.lng }
    : DEFAULT_REGION;

  const [coords, setCoords] = useState(
    initial?.lat ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [resolved, setResolved] = useState({
    fullAddress: initial?.fullAddress || "",
    city: initial?.city || "",
    pincode: initial?.pincode || "",
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);

  // On open with no initial spot, jump to the user's location once.
  useEffect(() => {
    if (!initial?.lat) locate(true);
    return () => {
      clearTimeout(searchTimer.current);
      clearTimeout(geoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced reverse geocode whenever the pin settles on a new spot.
  const resolveAt = useCallback((lat, lng) => {
    clearTimeout(geoTimer.current);
    setResolving(true);
    geoTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng);
      setResolved((prev) => ({
        fullAddress: addr.fullAddress || prev.fullAddress,
        city: addr.city || prev.city,
        pincode: addr.pincode || prev.pincode,
      }));
      setResolving(false);
    }, 350);
  }, []);

  function onRegionChangeComplete(region) {
    if (skipNextRegion.current) { skipNextRegion.current = false; return; }
    const next = { lat: region.latitude, lng: region.longitude };
    setCoords(next);
    resolveAt(next.lat, next.lng);
  }

  function recenter(lat, lng) {
    skipNextRegion.current = true;
    setCoords({ lat, lng });
    mapRef.current?.animateToRegion(
      { ...DEFAULT_REGION, latitude: lat, longitude: lng },
      350
    );
    resolveAt(lat, lng);
  }

  async function locate(silent = false) {
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      recenter(c.lat, c.lng);
    } catch (e) {
      if (!silent) {
        Alert.alert(
          "Location off",
          e.code === "PERMISSION_DENIED"
            ? "Allow location access to use your current spot, or search/drag the map instead."
            : "Couldn't get your location. Search or drag the map instead."
        );
      }
    } finally {
      setLocating(false);
    }
  }

  function onChangeQuery(text) {
    setQuery(text);
    clearTimeout(searchTimer.current);
    if (text.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchPlaces(text, sessionRef.current);
      setResults(r);
      setSearching(false);
    }, 300);
  }

  async function pickPrediction(item) {
    Keyboard.dismiss();
    setQuery(item.primary);
    setResults([]);
    setResolving(true);
    try {
      const d = await getPlaceDetails(item.placeId, sessionRef.current);
      sessionRef.current = newSessionToken(); // close the billing session
      if (d.lat) recenter(d.lat, d.lng);
      setResolved({
        fullAddress: d.fullAddress,
        city: d.city,
        pincode: d.pincode,
      });
    } catch {
      Alert.alert("Hmm", "Couldn't load that place. Try another result.");
    } finally {
      setResolving(false);
    }
  }

  function confirm() {
    if (!coords) return;
    onConfirm({ ...coords, ...resolved });
  }

  const canConfirm = coords && resolved.fullAddress;

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={startRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Fixed center pin — the map moves under it, so its tip marks the spot */}
      <View pointerEvents="none" style={styles.centerPin}>
        <Ionicons name="location" size={40} color={colors.ink} />
        <View style={styles.pinDot} />
      </View>

      {/* Top: close + search */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.searchRow}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Search area, street, landmark…"
              value={query}
              onChangeText={onChangeQuery}
              autoCorrect={false}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          {searching ? (
            <ActivityIndicator style={styles.iconBtn} color={colors.textMuted} />
          ) : query.length > 0 ? (
            <Pressable onPress={() => onChangeQuery("")} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="close-circle" size={20} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        {results.length > 0 && (
          <View style={styles.results}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={results}
              keyExtractor={(it) => it.placeId}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickPrediction(item)}
                  style={({ pressed }) => [styles.resultRow, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Txt weight={font.weight.semibold} numberOfLines={1}>{item.primary}</Txt>
                    {item.secondary ? (
                      <Txt faint size={font.size.sm} numberOfLines={1}>{item.secondary}</Txt>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {/* Use current location */}
      <Pressable
        onPress={() => locate(false)}
        style={[styles.gpsBtn, { bottom: bottomSheetHeight(insets) + spacing.md }]}
      >
        {locating ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Ionicons name="locate" size={20} color={colors.ink} />
        )}
        <Txt weight={font.weight.semibold} size={font.size.sm}>Use current location</Txt>
      </Pressable>

      {/* Bottom: resolved address + confirm */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <Txt faint size={font.size.xs} weight={font.weight.semibold} style={{ letterSpacing: 0.4 }}>
          SELECTED LOCATION
        </Txt>
        <View style={styles.addrRow}>
          <Ionicons name="location" size={18} color={colors.ink} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            {resolving ? (
              <Txt muted>Finding address…</Txt>
            ) : (
              <>
                <Txt weight={font.weight.semibold} numberOfLines={2}>
                  {resolved.fullAddress || "Move the map or search to set a spot"}
                </Txt>
                {(resolved.city || resolved.pincode) ? (
                  <Txt faint size={font.size.sm}>
                    {resolved.city}{resolved.pincode ? ` · ${resolved.pincode}` : ""}
                  </Txt>
                ) : null}
              </>
            )}
          </View>
        </View>
        <Button title="Confirm location" onPress={confirm} disabled={!canConfirm} />
      </View>
    </View>
  );
}

function bottomSheetHeight(insets) {
  return 150 + insets.bottom;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  centerPin: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
    // lift the pin so its tip sits on the true center
    marginBottom: 40,
  },
  pinDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink, marginTop: -2,
  },
  top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: spacing.lg },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  iconBtn: {
    width: 40, height: 48, alignItems: "center", justifyContent: "center",
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderColor: colors.borderStrong,
  },
  results: {
    backgroundColor: colors.bg, borderRadius: radii.md, marginTop: spacing.xs,
    borderWidth: 1, borderColor: colors.border, maxHeight: 260, overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  gpsBtn: {
    position: "absolute", right: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    backgroundColor: colors.bg, borderColor: colors.borderStrong, borderWidth: 1,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill,
    ...Platform.select({ android: { elevation: 3 } }),
  },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    borderTopWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md,
  },
  addrRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
});
