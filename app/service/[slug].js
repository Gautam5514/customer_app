import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ImageCarousel } from "../../src/components/ImageCarousel";
import { Txt, Row, Button, Loading, ErrorState } from "../../src/components/ui";
import { useService } from "../../src/lib/queries";
import { serviceImages } from "../../src/lib/serviceImages";
import { useAuthGate } from "../../src/lib/useAuthGate";
import { inr, quote } from "../../src/lib/format";
import { colors, spacing, font, radii, categoryMeta } from "../../src/theme";

const TRUST = [
  { icon: "shield-checkmark", label: "Verified\nprofessional" },
  { icon: "card", label: "Pay after\nservice" },
  { icon: "ribbon", label: "30-day\nwarranty" },
];

const HOW = [
  { icon: "calendar-outline", title: "Pick a slot", sub: "Choose a date & time that suits you" },
  { icon: "key-outline", title: "Pro arrives & verifies", sub: "Share your PIN to start the job" },
  { icon: "checkmark-done-outline", title: "Pay after it's done", sub: "Cash or online — only once you're happy" },
];

export default function ServiceDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useService(slug);
  const gate = useAuthGate();

  const service = data?.service;
  const q = service ? quote(service.basePrice) : null;
  const catLabel = service ? (categoryMeta[service.category]?.label || service.category) : "";

  // Booking requires an account — gate it here, sending guests through sign-in
  // and resuming straight into checkout afterwards.
  function onBook() {
    gate({
      pathname: "/booking/new",
      params: {
        slug: service.slug,
        name: service.name,
        category: service.category,
        basePrice: String(service.basePrice),
      },
    });
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Service details" />
        <Loading />
      </View>
    );
  }

  if (isError || !service) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Service details" />
        <ErrorState
          title={isError ? "Couldn't load this service" : "Service not available"}
          subtitle={
            isError
              ? "Check your internet connection and try again."
              : "This service may have been removed. Browse the latest services from home."
          }
          onRetry={isError ? refetch : undefined}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* ── Immersive gallery — edge to edge, under the status bar ── */}
        <ImageCarousel images={serviceImages(service)} category={service.category} height={280} />

        {/* ── Content sheet — overlaps the photo like a bottom sheet ── */}
        <View style={styles.sheet}>
          {/* Title block */}
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
            <Row gap={spacing.sm}>
              <View style={styles.catTag}>
                <Txt size={font.size.xs} weight={font.weight.bold} color={colors.textMuted} style={{ letterSpacing: 1 }}>
                  {String(catLabel).toUpperCase()}
                </Txt>
              </View>
              {service.isPopular ? (
                <View style={styles.popularTag}>
                  <Ionicons name="flame" size={11} color={colors.warning} />
                  <Txt size={font.size.xs} weight={font.weight.bold} color={colors.warning}>MOST BOOKED</Txt>
                </View>
              ) : null}
            </Row>

            <Txt size={font.size.xxl} weight={font.weight.heavy} style={{ marginTop: spacing.md, letterSpacing: -0.3 }}>
              {service.name}
            </Txt>

            <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
              <Row gap={4}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Txt weight={font.weight.bold} size={font.size.sm}>4.8</Txt>
                <Txt muted size={font.size.sm}>(2.3k bookings)</Txt>
              </Row>
              <View style={styles.metaDot} />
              <Row gap={4}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Txt muted size={font.size.sm}>~{service.estimatedDurationMinutes} min</Txt>
              </Row>
            </Row>

            {/* Price line */}
            <Row gap={6} align="flex-end" style={{ marginTop: spacing.lg }}>
              <Txt size={font.size.display} weight={font.weight.heavy} style={{ letterSpacing: -0.5 }}>
                {inr(service.basePrice)}
              </Txt>
              <Txt muted size={font.size.sm} style={{ marginBottom: 5 }}>
                {service.priceUnit === "per_hour" ? "per hour" : "per visit"} · taxes extra
              </Txt>
            </Row>
          </View>

          {/* Trust strip */}
          <Row style={styles.trust}>
            {TRUST.map((t, i) => (
              <React.Fragment key={t.label}>
                {i > 0 ? <View style={styles.trustDivider} /> : null}
                <View style={{ flex: 1, alignItems: "center", gap: 7 }}>
                  <View style={styles.trustIcon}>
                    <Ionicons name={t.icon} size={17} color={colors.ink} />
                  </View>
                  <Txt size={font.size.xs} muted weight={font.weight.medium} center style={{ lineHeight: 15 }}>
                    {t.label}
                  </Txt>
                </View>
              </React.Fragment>
            ))}
          </Row>

          <View style={{ paddingHorizontal: spacing.xl }}>
            {/* About */}
            {service.description ? (
              <View style={{ marginBottom: spacing.xxl }}>
                <Txt weight={font.weight.bold} size={font.size.lg} style={styles.sectionTitle}>About this service</Txt>
                <Txt muted style={{ lineHeight: 23 }}>{service.description}</Txt>
              </View>
            ) : null}

            {/* What's included */}
            {service.whatIsIncluded?.length ? (
              <View style={{ marginBottom: spacing.xxl }}>
                <Txt weight={font.weight.bold} size={font.size.lg} style={styles.sectionTitle}>What's included</Txt>
                <View style={styles.includedCard}>
                  {service.whatIsIncluded.map((item, i) => (
                    <Row
                      key={i}
                      gap={spacing.md}
                      align="flex-start"
                      style={[styles.includedRow, i < service.whatIsIncluded.length - 1 && styles.includedBorder]}
                    >
                      <View style={styles.checkTile}>
                        <Ionicons name="checkmark" size={13} color={colors.success} />
                      </View>
                      <Txt size={font.size.base} style={{ flex: 1, lineHeight: 21 }}>{item}</Txt>
                    </Row>
                  ))}
                </View>
              </View>
            ) : null}

            {/* How it works */}
            <View style={{ marginBottom: spacing.xxl }}>
              <Txt weight={font.weight.bold} size={font.size.lg} style={styles.sectionTitle}>How it works</Txt>
              <View style={{ gap: 0 }}>
                {HOW.map((s, i) => (
                  <Row key={s.title} gap={spacing.md} align="flex-start">
                    <View style={{ alignItems: "center" }}>
                      <View style={styles.stepIcon}>
                        <Ionicons name={s.icon} size={17} color={colors.ink} />
                      </View>
                      {i < HOW.length - 1 ? <View style={styles.stepLine} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: i < HOW.length - 1 ? spacing.lg : 0 }}>
                      <Txt weight={font.weight.semibold} size={font.size.base}>{s.title}</Txt>
                      <Txt muted size={font.size.sm} style={{ marginTop: 2 }}>{s.sub}</Txt>
                    </View>
                  </Row>
                ))}
              </View>
            </View>

            {/* Payment summary */}
            <View style={styles.priceCard}>
              <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>Payment summary</Txt>
              <PriceRow label="Service charge" value={inr(q.base)} />
              <PriceRow label="Platform fee (10%)" value={inr(q.platformFee)} />
              <PriceRow label="GST (18%)" value={inr(q.tax)} />
              <View style={styles.priceDivider} />
              <Row justify="space-between">
                <Txt weight={font.weight.bold} size={font.size.md}>Total</Txt>
                <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(q.total)}</Txt>
              </Row>
              <Row gap={6} style={styles.payNote}>
                <Ionicons name="lock-closed" size={12} color={colors.success} />
                <Txt size={font.size.xs} color={colors.success} weight={font.weight.semibold}>
                  Pay only after the job is done
                </Txt>
              </Row>
            </View>

            {/* Warranty ribbon */}
            <Row gap={spacing.md} style={styles.warranty}>
              <Ionicons name="ribbon" size={22} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.bold} size={font.size.sm}>30-day service warranty</Txt>
                <Txt muted size={font.size.xs} style={{ marginTop: 1 }}>
                  Same issue returns? We'll fix it again, free.
                </Txt>
              </View>
            </Row>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating back button over the photo ── */}
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        hitSlop={10}
        style={[styles.backBtn, { top: insets.top + spacing.sm }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textOnInk} />
      </Pressable>

      {/* ── Sticky CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Txt faint size={font.size.xs}>Total</Txt>
          <Txt weight={font.weight.heavy} size={font.size.xl}>{inr(q.total)}</Txt>
        </View>
        <Button
          title="Book now"
          rightIcon="arrow-forward"
          fullWidth={false}
          style={{ paddingHorizontal: 34 }}
          onPress={onBook}
        />
      </View>
    </View>
  );
}

function PriceRow({ label, value }) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
      <Txt muted size={font.size.sm}>{label}</Txt>
      <Txt size={font.size.sm} weight={font.weight.medium}>{value}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  // Rounded sheet pulled up over the gallery's bottom edge.
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl + 4,
    borderTopRightRadius: radii.xl + 4,
    marginTop: -(radii.xl + 4),
  },

  backBtn: {
    position: "absolute", left: spacing.lg,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(10,10,10,0.45)",
    alignItems: "center", justifyContent: "center",
  },

  catTag: {
    backgroundColor: colors.surfaceSunken, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  popularTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.warningSoft, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textFaint },

  trust: {
    marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.xxl,
    paddingVertical: spacing.lg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
  },
  trustIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },
  trustDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border, marginVertical: 4 },

  sectionTitle: { marginBottom: spacing.md },

  includedCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: "hidden" },
  includedRow: { padding: spacing.md, paddingHorizontal: spacing.lg },
  includedBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  checkTile: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.successSoft,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },

  stepIcon: {
    width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  stepLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginVertical: 4 },

  priceCard: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  priceDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  payNote: {
    marginTop: spacing.md, alignSelf: "flex-start",
    backgroundColor: colors.successSoft, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },

  warranty: {
    backgroundColor: colors.goldSoft, borderRadius: radii.lg,
    padding: spacing.lg, alignItems: "center",
  },

  footer: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
});
