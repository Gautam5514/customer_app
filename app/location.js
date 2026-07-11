import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row } from "../src/components/ui";
import { LocationPicker } from "../src/components/LocationPicker";
import { useLocation } from "../src/store/location";
import { useAuth } from "../src/store/auth";
import { useAddresses } from "../src/lib/queries";
import { getCurrentCoords, reverseGeocode } from "../src/lib/places";
import { colors, spacing, font, radii } from "../src/theme";

// Independent "Select location" page (UC-style). The active app location can
// be: the live GPS position, any saved address (Home / Work / …), or a spot
// searched/pinned on the map. Selecting anything sets it app-wide and returns.
export default function SelectLocation() {
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const { user } = useAuth();
  const { data } = useAddresses();
  const addresses = data?.addresses || [];

  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);

  function done(loc) {
    setLocation(loc);
    router.back();
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { lat, lng } = await getCurrentCoords();
      const addr = await reverseGeocode(lat, lng);
      done({ lat, lng, ...addr, source: "gps" });
    } catch {
      Alert.alert(
        "Location unavailable",
        "Allow location access in your phone settings, or search your area instead."
      );
    } finally {
      setLocating(false);
    }
  }

  function selectSaved(a) {
    done({
      lat: a.lat, lng: a.lng,
      fullAddress: a.fullAddress, city: a.city, pincode: a.pincode,
      source: "manual", savedId: a._id,
    });
  }

  const gpsActive = location?.source === "gps";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Select location" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Search — full picker with map + place search */}
        <Pressable onPress={() => setPicking(true)} style={({ pressed }) => [styles.searchRow, pressed && { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <Txt muted size={font.size.base}>Search area, street, landmark…</Txt>
        </Pressable>

        {/* Use current location */}
        <Pressable onPress={useCurrentLocation} disabled={locating} style={({ pressed }) => [styles.optionRow, pressed && { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.gpsIcon}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Ionicons name="locate" size={19} color={colors.gold} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.bold} size={font.size.base}>Use my current location</Txt>
            <Txt muted size={font.size.xs} numberOfLines={1} style={{ marginTop: 2 }}>
              {gpsActive && location?.fullAddress ? location.fullAddress : "Detect automatically via GPS"}
            </Txt>
          </View>
          {gpsActive ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : <Ionicons name="chevron-forward" size={17} color={colors.textFaint} />}
        </Pressable>

        {/* Saved addresses */}
        {user ? (
          <>
            <Txt faint size={font.size.xs} weight={font.weight.bold} style={styles.sectionLabel}>
              SAVED ADDRESSES
            </Txt>
            {addresses.map((a) => {
              const active = location?.savedId === a._id;
              return (
                <Pressable key={a._id} onPress={() => selectSaved(a)} style={({ pressed }) => [styles.optionRow, pressed && { backgroundColor: colors.surfaceAlt }]}>
                  <View style={styles.addrIcon}>
                    <Ionicons
                      name={a.label === "Work" ? "briefcase-outline" : a.label === "Home" ? "home-outline" : "location-outline"}
                      size={18}
                      color={colors.ink}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Row gap={6}>
                      <Txt weight={font.weight.bold} size={font.size.base}>{a.label}</Txt>
                      {a.isDefault ? (
                        <View style={styles.defaultTag}>
                          <Txt size={9} weight={font.weight.bold} color={colors.textMuted}>DEFAULT</Txt>
                        </View>
                      ) : null}
                    </Row>
                    <Txt muted size={font.size.xs} numberOfLines={2} style={{ marginTop: 2, lineHeight: 16 }}>
                      {a.fullAddress}{a.city ? `, ${a.city}` : ""}
                    </Txt>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
                </Pressable>
              );
            })}

            {/* Add new — jumps to the saved-addresses manager */}
            <Pressable onPress={() => router.push("/addresses")} style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.8 }]}>
              <Ionicons name="add-circle-outline" size={19} color={colors.ink} />
              <Txt weight={font.weight.semibold} size={font.size.sm}>
                {addresses.length === 0 ? "Save an address (Home, Work…)" : "Add new address"}
              </Txt>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <LocationPicker
          initial={location}
          onConfirm={(loc) => { setPicking(false); done({ ...loc, source: "manual" }); }}
          onClose={() => setPicking(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.md,
    paddingHorizontal: spacing.md, height: 46, backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface,
  },
  gpsIcon: {
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },
  addrIcon: {
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },
  sectionLabel: { letterSpacing: 1.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  defaultTag: {
    backgroundColor: colors.surfaceSunken, borderRadius: radii.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  addRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: spacing.lg, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.borderStrong, borderStyle: "dashed", marginTop: spacing.sm,
  },
});
