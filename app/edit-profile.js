import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Input, Button } from "../src/components/ui";
import { useAuth } from "../src/store/auth";
import { api, apiError } from "../src/lib/api";
import { colors, spacing, font } from "../src/theme";

// Complete/edit profile — backs the "Complete" button on the account page.
// The server accepts fullName + phone (email is fixed at registration).
export default function EditProfile() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const name = fullName.trim();
    const p = phone.trim();
    if (name.length < 2) return Alert.alert("Name required", "Please enter your full name.");
    if (!/^\d{10}$/.test(p)) return Alert.alert("Invalid phone", "Phone number must be exactly 10 digits.");

    setSaving(true);
    try {
      await api.put("/auth/me", { fullName: name, phone: p });
      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", apiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Complete profile" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Txt muted size={font.size.sm} style={{ marginBottom: spacing.xl, lineHeight: 20 }}>
            Your name and phone number help professionals reach you at the doorstep.
          </Txt>
          <Input
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Gautam Pandit"
            autoCapitalize="words"
          />
          <Input
            label="Phone number"
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
          />
          {user?.email ? (
            <Input label="Email" value={user.email} editable={false} style={{ color: colors.textMuted }} />
          ) : null}
          <Button title="Save" onPress={save} loading={saving} style={{ marginTop: spacing.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
