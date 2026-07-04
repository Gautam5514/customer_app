import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { categoryMeta, colors, radii } from "../theme";

// Renders the on-brand vector icon for a service category (AC, fridge, fan…),
// using that category's accent colour. Single source of truth so every screen
// shows the same crisp, coloured glyph.
export function CategoryIcon({ category, size = 24, color }) {
  const meta = categoryMeta[category] || {};
  return <MaterialCommunityIcons name={meta.icon || "wrench"} size={size} color={color || meta.color || colors.ink} />;
}

// Coloured icon sitting on its category's soft tinted tile — the premium,
// recognisable badge used on service grids, cards and detail heroes.
export function CategoryBadge({ category, size = 52, radius = radii.md, iconSize, style }) {
  const meta = categoryMeta[category] || {};
  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius: radius,
          backgroundColor: meta.tint || colors.surfaceAlt,
          alignItems: "center", justifyContent: "center",
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={meta.icon || "wrench"} size={iconSize || Math.round(size * 0.5)} color={meta.color || colors.ink} />
    </View>
  );
}
