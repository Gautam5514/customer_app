import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row } from "./ui";
import { CategoryIcon } from "./CategoryIcon";
import { serviceImages } from "../lib/serviceImages";
import { inr } from "../lib/format";
import { colors, spacing, font, radii, categoryMeta, shadow } from "../theme";

// Premium media card for service listings — photo banner on top, details below.
// Two layouts from one component:
//   <ServiceMediaCard service={s} onPress={…} />                 → full-width (category list)
//   <ServiceMediaCard service={s} onPress={…} compact width={W}/> → carousel tile (home)
//
// A soft shadow lifts the card off the page; a fine hairline border keeps its
// edge crisp. Shadow lives on the outer Pressable and the rounded-corner photo
// clip on an inner wrapper — a view can't cast a shadow and clip its own
// content at the same time. If the photo is missing or fails to load, a
// tinted category-icon panel takes its place so the card never looks broken.
export function ServiceMediaCard({ service, onPress, compact = false, width }) {
  const [imgFailed, setImgFailed] = useState(false);
  const images = serviceImages(service);
  const uri = !imgFailed && images.length > 0 ? images[0] : null;
  const meta = categoryMeta[service.category] || {};
  const includes = (service.whatIsIncluded || []).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shadowWrap,
        compact && { width },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.card}>
      {/* ── Photo banner ── */}
      <View style={[styles.media, { height: compact ? 96 : 150 }]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.mediaFallback, { backgroundColor: meta.tint || colors.surfaceAlt }]}>
            <CategoryIcon category={service.category} size={compact ? 30 : 40} />
          </View>
        )}

        {/* Most-booked pill floats on the photo */}
        {service.isPopular ? (
          <View style={styles.popularPill}>
            <Ionicons name="flame" size={10} color={colors.gold} />
            <Txt color={colors.textOnInk} size={10} weight={font.weight.bold} style={{ letterSpacing: 0.6 }}>
              MOST BOOKED
            </Txt>
          </View>
        ) : null}

        {/* Duration chip anchors bottom-right of the photo */}
        <View style={styles.durationChip}>
          <Ionicons name="time-outline" size={11} color={colors.ink} />
          <Txt size={11} weight={font.weight.semibold} color={colors.ink}>
            {service.estimatedDurationMinutes || 60} min
          </Txt>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={{ padding: compact ? spacing.md : spacing.lg }}>
        <Txt weight={font.weight.bold} size={compact ? font.size.sm : font.size.md} numberOfLines={1}>
          {service.name}
        </Txt>

        <Row gap={5} style={{ marginTop: 3 }}>
          <Ionicons name="star" size={11} color={colors.gold} />
          <Txt size={font.size.xs} weight={font.weight.semibold}>4.8</Txt>
          <Txt faint size={font.size.xs}>·</Txt>
          <Txt muted size={font.size.xs} numberOfLines={1} style={{ flexShrink: 1 }}>
            {meta.label || service.category}
          </Txt>
        </Row>

        {/* Included highlights — full card only */}
        {!compact && includes.length > 0 ? (
          <Row gap={spacing.md} style={{ marginTop: spacing.sm, flexWrap: "wrap" }}>
            {includes.map((item) => (
              <Row key={item} gap={4}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Txt muted size={font.size.xs} numberOfLines={1}>{item}</Txt>
              </Row>
            ))}
          </Row>
        ) : null}

        {/* Price + book action */}
        <Row justify="space-between" style={{ marginTop: compact ? spacing.sm : spacing.md }}>
          <View>
            <Txt faint size={10} style={{ letterSpacing: 0.4 }}>STARTS AT</Txt>
            <Txt weight={font.weight.heavy} size={compact ? font.size.md : font.size.lg}>
              {inr(service.basePrice)}
            </Txt>
          </View>
          <View style={[styles.bookBtn, compact && styles.bookBtnCompact]}>
            <Txt color={colors.textOnInk} weight={font.weight.bold} size={compact ? 11 : font.size.sm}>Book</Txt>
            <Ionicons name="arrow-forward" size={compact ? 12 : 14} color={colors.textOnInk} />
          </View>
        </Row>
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  media: {
    backgroundColor: colors.surfaceSunken,
  },
  mediaFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  popularPill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,10,10,0.82)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  durationChip: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  bookBtnCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
});
