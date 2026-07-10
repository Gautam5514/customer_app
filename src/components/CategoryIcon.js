import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { categoryMeta, colors, radii, shadow } from "../theme";
import { categoryThumbnails } from "../lib/categoryImages";

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

// Photo-led tile for category browsing grids (onboarding, home). Shows the
// real service photo when we have one for that category, falling back to
// the tinted vector-icon badge otherwise — so the grid never looks broken.
// Sizing/shape (width, height, aspectRatio, margin…) comes from the caller's
// `style`; `radius` controls the corner rounding of both the shadow-casting
// outer view and the image-clipping inner view (kept as two views because a
// view can't both cast a shadow and clip its own content to rounded corners).
export function CategoryTile({ category, iconSize = 24, radius = radii.lg, style }) {
  const meta = categoryMeta[category] || {};
  const thumb = categoryThumbnails[category];
  const [failed, setFailed] = useState(false);
  const showImage = thumb && !failed;

  return (
    <View style={[shadow.soft, { borderRadius: radius }, style]}>
      <View
        style={[
          tileStyles.tile,
          { borderRadius: radius },
          !showImage && { backgroundColor: meta.tint || colors.surfaceAlt },
        ]}
      >
        {showImage ? (
          <Image
            source={thumb}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            onError={() => setFailed(true)}
          />
        ) : (
          <MaterialCommunityIcons name={meta.icon || "wrench"} size={iconSize} color={meta.color || colors.ink} />
        )}
      </View>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
