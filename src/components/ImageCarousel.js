import React, { useState } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { CategoryIcon } from "./CategoryIcon";
import { categoryMeta, colors, spacing, radii } from "../theme";

// Edge-to-edge, swipeable image gallery for a service. Each slide shows the
// real photo over a tinted icon panel, so a slow/failed image still looks
// intentional (premium fallback) rather than a broken box.
export function ImageCarousel({ images = [], category, height = 220 }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const tint = categoryMeta[category]?.tint || colors.surfaceAlt;
  const slides = images.length ? images : [null]; // always render the panel

  return (
    <View style={{ height, backgroundColor: tint }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {slides.map((uri, i) => (
          <View key={i} style={{ width, height }}>
            {/* Fallback layer — visible until/if the photo loads */}
            <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: tint }]}>
              <CategoryIcon category={category} size={72} />
            </View>
            {uri ? (
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
                cachePolicy="memory-disk"
              />
            ) : null}
          </View>
        ))}
      </ScrollView>

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  dots: {
    position: "absolute", bottom: spacing.md, alignSelf: "center",
    flexDirection: "row", gap: 6,
    backgroundColor: "rgba(0,0,0,0.25)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: radii.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)" },
  dotActive: { backgroundColor: "#fff", width: 16 },
});
