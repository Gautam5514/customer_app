import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "../../src/components/Logo";
import { CategoryIcon, CategoryBadge } from "../../src/components/CategoryIcon";
import { LocationPicker } from "../../src/components/LocationPicker";
import { Txt, Row, SectionHeader, Skeleton, ErrorState, EmptyState } from "../../src/components/ui";
import { ServiceMediaCard } from "../../src/components/ServiceMediaCard";
import { useServices } from "../../src/lib/queries";
import { useAuth } from "../../src/store/auth";
import { useLocation } from "../../src/store/location";
import { useLightStatusBar } from "../../src/lib/useStatusBar";
import { inr, initials } from "../../src/lib/format";
import { colors, spacing, font, radii, categoryMeta, shadow } from "../../src/theme";
import { Image } from "expo-image";
import { serviceImages } from "../../src/lib/serviceImages";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useServices();
  const { location, setLocation, markAsked, shouldPrompt } = useLocation();
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState(false);

  useLightStatusBar(); // dark header → light clock/battery icons

  // First launch only: open the picker once. shouldPrompt flips back to false
  // forever after the user picks or closes it (persisted), so we never nag.
  useEffect(() => {
    if (shouldPrompt) setPicking(true);
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
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Row justify="space-between">
          <Logo size={24} light />
          {user ? (
            <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.avatar} hitSlop={6}>
              <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.sm}>{initials(user?.fullName) || "U"}</Txt>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/(auth)/login")} style={styles.signInBtn} hitSlop={6}>
              <Ionicons name="person-circle-outline" size={16} color={colors.textOnInk} />
              <Txt color={colors.textOnInk} weight={font.weight.semibold} size={font.size.sm}>Sign in</Txt>
            </Pressable>
          )}
        </Row>

        {/* Location chip — tap to set/change; reused on every open after the first */}
        <Pressable onPress={() => setPicking(true)} style={styles.locChip} hitSlop={6}>
          <Ionicons name="location" size={14} color={colors.textOnInk} />
          <Txt color={colors.textOnInk} weight={font.weight.semibold} size={font.size.sm} numberOfLines={1} style={{ maxWidth: 240 }}>
            {location ? (location.city || location.fullAddress || "Location set") : "Set your location"}
          </Txt>
          <Ionicons name="chevron-down" size={14} color={colors.textOnInk} />
        </Pressable>

        <Txt color={colors.textOnInk} size={font.size.xl} weight={font.weight.bold} style={{ marginTop: spacing.md }}>
          {user ? `Hi ${user.fullName?.split(" ")[0] || "there"}, what needs fixing?` : "What needs fixing today?"}
        </Txt>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
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
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
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
            {/* Categories */}
            <SectionHeader title="What do you need?" />
            <View style={styles.grid}>
              {categories.map((cat) => {
                const meta = categoryMeta[cat] || { label: cat };
                return (
                  <Pressable
                    key={cat}
                    style={({ pressed }) => [styles.catCell, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push(`/category/${cat}`)}
                  >
                    <View style={[styles.catIcon, { backgroundColor: meta.tint || colors.surfaceAlt }]}>
                      <CategoryIcon category={cat} size={26} />
                    </View>
                    <Txt size={font.size.xs} weight={font.weight.semibold} center numberOfLines={1}>{meta.label}</Txt>
                  </Pressable>
                );
              })}
            </View>

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
          </>
        )}
      </ScrollView>

      <Modal visible={picking} animationType="slide" onRequestClose={() => { setPicking(false); markAsked(); }}>
        <LocationPicker
          initial={location}
          onConfirm={(loc) => { setLocation(loc); setPicking(false); }}
          onClose={() => { setPicking(false); markAsked(); }}
        />
      </Modal>
    </View>
  );
}

// Mirrors the loaded layout (category grid + promo + list rows) so the screen
// doesn't jump when real content arrives.
function HomeSkeleton() {
  return (
    <View>
      <Skeleton width={150} height={18} style={{ marginBottom: spacing.lg }} />
      <View style={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.catCell}>
            <Skeleton width={58} height={58} radius={radii.lg} />
            <Skeleton width={44} height={10} />
          </View>
        ))}
      </View>
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
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  locChip: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    marginTop: spacing.md, paddingVertical: 5, paddingHorizontal: spacing.sm,
    borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.12)",
  },
  signInBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radii.pill,
    paddingHorizontal: spacing.md, height: 34,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.md,
    paddingHorizontal: spacing.lg, height: 48, marginTop: spacing.lg,
    ...shadow.soft,
  },
  searchInput: { flex: 1, fontSize: font.size.md, color: colors.text, paddingVertical: 0 },

  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg, marginBottom: spacing.xl },
  catCell: { width: "25%", alignItems: "center", gap: 7, paddingHorizontal: 2 },
  catIcon: { width: 58, height: 58, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },

  promo: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, borderRadius: radii.lg, padding: spacing.md,
  },
  promoIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
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
