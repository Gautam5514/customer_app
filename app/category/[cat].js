import React, { useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { CategoryBadge } from "../../src/components/CategoryIcon";
import { ServiceMediaCard } from "../../src/components/ServiceMediaCard";
import { Txt, Row, Loading, EmptyState, ErrorState } from "../../src/components/ui";
import { useServices } from "../../src/lib/queries";
import { colors, spacing, font, radii, categoryMeta } from "../../src/theme";

// Fallback label for a category the app doesn't know yet (e.g. added by admin
// after this build shipped) — capitalised slug, no broken blank title.
function fallbackLabel(cat = "") {
  return String(cat).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Services";
}

const TRUST = [
  { icon: "shield-checkmark", label: "Verified pros" },
  { icon: "cash-outline",     label: "Pay after service" },
  { icon: "refresh",          label: "30-day warranty" },
];

export default function CategoryList() {
  const { cat } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useServices();
  const meta = categoryMeta[cat] || { label: fallbackLabel(cat) };

  const services = useMemo(
    () => (data?.services || []).filter((s) => s.category === cat),
    [data, cat]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={meta.label} />
      {isLoading ? (
        <Loading />
      ) : isError && services.length === 0 ? (
        <ErrorState
          title="Couldn't load services"
          subtitle="Check your internet connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s._id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.ink} />}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg }}>
              {/* Category intro */}
              <Row gap={spacing.md} style={{ marginBottom: spacing.md }}>
                <CategoryBadge category={cat} size={56} radius={radii.lg} iconSize={28} />
                <View style={{ flex: 1 }}>
                  <Txt size={font.size.lg} weight={font.weight.bold}>{meta.label}</Txt>
                  <Txt muted size={font.size.sm}>
                    {services.length} service{services.length !== 1 ? "s" : ""} · book in under a minute
                  </Txt>
                </View>
              </Row>

              {/* Trust strip — quiet, flat, sets the premium tone for the list */}
              <Row style={styles.trust} justify="space-between">
                {TRUST.map((t) => (
                  <Row key={t.label} gap={5} style={{ flexShrink: 1 }}>
                    <Ionicons name={t.icon} size={13} color={colors.ink} />
                    <Txt size={font.size.xs} weight={font.weight.medium} muted numberOfLines={1}>{t.label}</Txt>
                  </Row>
                ))}
              </Row>
            </View>
          }
          renderItem={({ item }) => (
            <ServiceMediaCard service={item} onPress={() => router.push(`/service/${item.slug}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No services here yet"
              subtitle="We're adding more services in this category soon. Explore other categories from the home screen."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trust: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
