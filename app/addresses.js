import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card, Button, Input, Pill, Loading, EmptyState, Chip } from "../src/components/ui";
import { LocationPicker } from "../src/components/LocationPicker";
import { useAddresses, useAddAddress, useSetDefaultAddress, useDeleteAddress } from "../src/lib/queries";
import { apiError } from "../src/lib/api";
import { colors, spacing, font, radii } from "../src/theme";

const LABELS = ["Home", "Work", "Other"];
const EMPTY_FORM = { label: "Home", fullAddress: "", city: "", pincode: "", lat: null, lng: null };

export default function Addresses() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useAddresses();
  const addMut = useAddAddress();
  const setDefault = useSetDefaultAddress();
  const del = useDeleteAddress();

  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const addresses = data?.addresses || [];

  function onPicked({ lat, lng, fullAddress, city, pincode }) {
    setForm((f) => ({
      ...f,
      lat, lng,
      fullAddress: fullAddress || f.fullAddress,
      city: city || f.city,
      pincode: pincode || f.pincode,
    }));
    setPicking(false);
    setAdding(true);
  }

  async function save() {
    setError(null);
    if (form.fullAddress.trim().length < 6) return setError("Enter the full address.");
    if (!form.city.trim()) return setError("Enter your city.");
    try {
      await addMut.mutateAsync({ ...form, isDefault: addresses.length === 0 });
      setForm(EMPTY_FORM);
      setAdding(false);
    } catch (e) {
      setError(apiError(e));
    }
  }

  function confirmDelete(id) {
    Alert.alert("Remove address", "Delete this saved address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Saved addresses" />
      {isLoading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }} keyboardShouldPersistTaps="handled">
          {addresses.length === 0 && !adding ? (
            <EmptyState icon="location-outline" title="No addresses yet" subtitle="Add an address to book services faster." />
          ) : (
            addresses.map((a) => (
              <Card key={a._id} style={{ marginBottom: spacing.md }}>
                <Row justify="space-between" align="flex-start">
                  <Row gap={spacing.sm} align="center">
                    <Ionicons name={a.label === "Work" ? "briefcase" : a.label === "Home" ? "home" : "location"} size={17} color={colors.ink} />
                    <Txt weight={font.weight.bold}>{a.label}</Txt>
                    {a.isDefault ? <Pill label="DEFAULT" tone="ink" /> : null}
                  </Row>
                  <Pressable onPress={() => confirmDelete(a._id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.textFaint} />
                  </Pressable>
                </Row>
                <Txt muted style={{ marginTop: 6, lineHeight: 20 }}>{a.fullAddress}</Txt>
                <Txt faint size={font.size.sm} style={{ marginTop: 2 }}>{a.city}{a.pincode ? ` · ${a.pincode}` : ""}</Txt>
                {!a.isDefault ? (
                  <Pressable onPress={() => setDefault.mutate(a._id)} style={{ marginTop: spacing.md }} hitSlop={6}>
                    <Txt color={colors.ink} weight={font.weight.semibold} size={font.size.sm}>Set as default</Txt>
                  </Pressable>
                ) : null}
              </Card>
            ))
          )}

          {adding ? (
            <Card style={{ marginTop: spacing.sm }}>
              <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>New address</Txt>

              <Pressable onPress={() => setPicking(true)} style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.85 }]}>
                <Ionicons name="map-outline" size={18} color={colors.ink} />
                <Txt weight={font.weight.semibold} size={font.size.sm}>
                  {form.lat ? "Change location on map" : "Locate on map"}
                </Txt>
                {form.lat ? <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: "auto" }} /> : null}
              </Pressable>

              <Row gap={spacing.sm} style={{ marginBottom: spacing.lg }}>
                {LABELS.map((l) => (
                  <Chip key={l} label={l} selected={form.label === l} onPress={() => setForm((f) => ({ ...f, label: l }))} />
                ))}
              </Row>
              <Input label="Full address" placeholder="House / flat, street, area" value={form.fullAddress} onChangeText={(t) => setForm((f) => ({ ...f, fullAddress: t }))} multiline />
              <Row gap={spacing.md}>
                <View style={{ flex: 1.4 }}><Input label="City" placeholder="City" value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} /></View>
                <View style={{ flex: 1 }}><Input label="Pincode" placeholder="000000" keyboardType="number-pad" maxLength={6} value={form.pincode} onChangeText={(t) => setForm((f) => ({ ...f, pincode: t.replace(/\D/g, "") }))} /></View>
              </Row>
              {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginBottom: spacing.md }}>{error}</Txt> : null}
              <Row gap={spacing.md}>
                <View style={{ flex: 1 }}><Button title="Cancel" variant="secondary" onPress={() => { setAdding(false); setError(null); }} /></View>
                <View style={{ flex: 1 }}><Button title="Save" onPress={save} loading={addMut.isPending} /></View>
              </Row>
            </Card>
          ) : (
            <Pressable onPress={() => setAdding(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
              <Ionicons name="add" size={20} color={colors.ink} />
              <Txt weight={font.weight.semibold}>Add new address</Txt>
            </Pressable>
          )}
        </ScrollView>
      )}

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <LocationPicker
          initial={form.lat ? form : null}
          onConfirm={onPicked}
          onClose={() => setPicking(false)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt, marginBottom: spacing.lg,
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: spacing.lg, borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.borderStrong, borderStyle: "dashed", marginTop: spacing.sm,
  },
});
