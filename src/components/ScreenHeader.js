import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "./ui";
import { colors, spacing, font } from "../theme";

// Reusable top bar for stack screens — back chevron + centered title.
export function ScreenHeader({ title, right, onBack, transparent = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 6 },
        !transparent && { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Pressable onPress={onBack || (() => router.back())} hitSlop={10} style={styles.btn}>
        <Ionicons name="chevron-back" size={24} color={colors.ink} />
      </Pressable>
      <Txt weight={font.weight.bold} size={font.size.md} numberOfLines={1} style={styles.title}>{title}</Txt>
      <View style={styles.btn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  btn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center" },
});
