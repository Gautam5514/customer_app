import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CategoryBadge, CategoryTile } from "../../src/components/CategoryIcon";
import { Txt, Row, SectionHeader, Skeleton, ErrorState, EmptyState } from "../../src/components/ui";
import { ServiceMediaCard } from "../../src/components/ServiceMediaCard";
import { ReferEarnCard } from "../../src/components/ReferEarnCard";
import { useServices } from "../../src/lib/queries";
import { useLocation } from "../../src/store/location";
import { useLightStatusBar } from "../../src/lib/useStatusBar";
import { inr } from "../../src/lib/format";
import { colors, spacing, font, radii, categoryMeta, shadow } from "../../src/theme";
import { Image } from "expo-image";
import { serviceImages } from "../../src/lib/serviceImages";

// Category row shows exactly 3 tiles per screen-width, sliding horizontally
// for the rest — sized from the real screen width so it works on any device.
const SCREEN_WIDTH = Dimensions.get("window").width;
const CAT_TILE_WIDTH = (SCREEN_WIDTH - spacing.xl - spacing.md * 2) / 3;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useServices();
  const { location, markAsked, shouldPrompt, detecting } = useLocation();
  const [search, setSearch] = useState("");

  useLightStatusBar(); // dark header → light clock/battery icons

  // First launch only (and only if GPS auto-detect didn't already resolve it):
  // open the location page once. markAsked persists so we never nag again.
  useEffect(() => {
    if (shouldPrompt) {
      markAsked();
      router.push("/location");
    }
  }, [shouldPrompt]);

  const services = data?.services || [];

  const categories = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const s of services) {
      if (!seen.has(s.category)) { seen.add(s.category); list.push(s.category); }
    }
    return list;
  }, [services]);

  const popular = useMemo(() => {
    const pop = services.filter((s) => s.isPopular);
    return (pop.length ? pop : services).slice(0, 6);
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return services
      .filter((s) => s.name.toLowerCase().includes(q) || String(s.category).toLowerCase().includes(q))
      .slice(0, 12);
  }, [search, services]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header — UC-style: current place centered up top, search below.
          The place auto-fills from real GPS on app open (see LocationProvider);
          tapping it opens the picker to change. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.push("/location")} style={({ pressed }) => [styles.locRow, pressed && { opacity: 0.7 }]} hitSlop={8}>
          <Ionicons name="location" size={15} color={colors.gold} />
          <Txt color={colors.textOnInk} weight={font.weight.semibold} size={font.size.sm} numberOfLines={1} style={{ maxWidth: 270 }}>
            {detecting && !location
              ? "Detecting your location…"
              : location
                ? location.fullAddress || location.city || "Location set"
                : "Set your location"}
          </Txt>
          <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.6)" />
        </Pressable>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            placeholder="Search AC, fridge, electrician…"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.ink} />}
      >
        {isLoading ? (
          <HomeSkeleton />
        ) : isError && services.length === 0 ? (
          // ── Failed to load & nothing cached — never show a blank home ──
          <ErrorState
            title="Couldn't load services"
            subtitle="Check your internet connection and try again."
            onRetry={refetch}
          />
        ) : search ? (
          // ── Search results ──────────────────────────────────────
          <View>
            <SectionHeader title={`Results for "${search.trim()}"`} />
            {filtered.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="No matches found"
                subtitle={`Nothing matches "${search.trim()}". Try "AC", "fridge" or "electrician".`}
              />
            ) : (
              filtered.map((s) => <ServiceCard key={s._id} service={s} onPress={() => router.push(`/service/${s.slug}`)} />)
            )}
          </View>
        ) : (
          <>
            {/* Categories — 3 tiles per screen, slides horizontally for the rest */}
            <SectionHeader title="What do you need?" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catRow}
            >
              {categories.map((cat) => {
                const meta = categoryMeta[cat] || { label: cat };
                return (
                  <Pressable
                    key={cat}
                    style={({ pressed }) => [styles.catCell, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push(`/category/${cat}`)}
                  >
                    <CategoryTile category={cat} iconSize={28} style={styles.catIcon} />
                    <Txt size={font.size.xs} weight={font.weight.semibold} center numberOfLines={1}>{meta.label}</Txt>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Offer — informational banner; the code is applied at checkout */}
            <View style={styles.promo}>
              <View style={styles.promoIcon}>
                <Ionicons name="pricetag" size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>Flat ₹100 off your first booking</Txt>
                <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginTop: 1 }}>
                  Use code <Txt color={colors.gold} weight={font.weight.bold}>ELITE100</Txt> at checkout
                </Txt>
              </View>
            </View>

            {/* Most booked — full-width media cards, scrolls with the page */}
            <View style={{ marginTop: spacing.xxl }}>
              <SectionHeader title="Most booked" />
              {popular.map((s) => (
                <ServiceMediaCard
                  key={s._id}
                  service={s}
                  onPress={() => router.push(`/service/${s.slug}`)}
                />
              ))}
            </View>

            {/* Refer & earn — same card as the Account page, closing the feed */}
            <ReferEarnCard style={{ marginTop: spacing.lg }} />
          </>
        )}
      </ScrollView>

    </View>
  );
}

// Mirrors the loaded layout (category grid + promo + list rows) so the screen
// doesn't jump when real content arrives.
function HomeSkeleton() {
  return (
    <View>
      <Skeleton width={150} height={18} style={{ marginBottom: spacing.lg }} />
      <Row gap={spacing.md} style={{ marginBottom: spacing.xl }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.catCell}>
            <Skeleton width={CAT_TILE_WIDTH} height={CAT_TILE_WIDTH} radius={radii.lg} />
            <Skeleton width={44} height={10} />
          </View>
        ))}
      </Row>
      <Skeleton height={72} radius={radii.lg} style={{ marginBottom: spacing.xxl }} />
      <Skeleton width={120} height={18} style={{ marginBottom: spacing.lg }} />
      {/* Mirrors the stacked media cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <View key={i} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, overflow: "hidden", marginBottom: spacing.md }}>
          <Skeleton width="100%" height={150} radius={0} />
          <View style={{ padding: spacing.lg, gap: 8 }}>
            <Skeleton width="60%" height={15} />
            <Skeleton width="40%" height={11} />
            <Row justify="space-between" style={{ marginTop: 6 }}>
              <Skeleton width={70} height={18} />
              <Skeleton width={78} height={32} radius={radii.md} />
            </Row>
          </View>
        </View>
      ))}
    </View>
  );
}

// Clean service row: badge · name · rating/time · price.
function ServiceCard({ service, onPress }) {
  const images = serviceImages(service);
  const firstImage = images.length > 0 ? images[0] : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
      {firstImage ? (
        <Image
          source={{ uri: firstImage }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <CategoryBadge category={service.category} size={48} iconSize={24} />
      )}
      <View style={{ flex: 1 }}>
        <Txt weight={font.weight.semibold} size={font.size.md} numberOfLines={1}>{service.name}</Txt>
        <Row gap={7} style={{ marginTop: 3 }}>
          <Row gap={3}>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Txt size={font.size.xs} weight={font.weight.semibold}>4.8</Txt>
          </Row>
          <Txt faint size={font.size.xs}>·</Txt>
          <Txt muted size={font.size.xs}>~{service.estimatedDurationMinutes} min</Txt>
        </Row>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Txt faint size={font.size.xs}>from</Txt>
        <Txt weight={font.weight.bold} size={font.size.md}>{inr(service.basePrice)}</Txt>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  locRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, alignSelf: "center" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.md,
    paddingHorizontal: spacing.md, height: 46, marginTop: spacing.md,
  },
  searchInput: { flex: 1, fontSize: font.size.base, color: colors.text, paddingVertical: 0 },

  // Bleeds full-width past the screen's own padding so the row can scroll
  // edge to edge; contentContainerStyle re-adds the padding as scrollable
  // content instead so items still line up with the rest of the page.
  catScroll: { marginHorizontal: -spacing.xl, marginBottom: spacing.xl },
  catRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  catCell: { width: CAT_TILE_WIDTH, alignItems: "center", gap: 7 },
  catIcon: { width: CAT_TILE_WIDTH, height: CAT_TILE_WIDTH },

  promo: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, borderRadius: radii.lg, padding: spacing.md,
    borderWidth: 1, borderColor: "rgba(200,164,92,0.3)",
    ...shadow.card,
  },
  promoIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: "rgba(200,164,92,0.14)", alignItems: "center", justifyContent: "center",
  },

  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
});
