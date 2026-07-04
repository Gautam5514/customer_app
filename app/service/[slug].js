import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ImageCarousel } from "../../src/components/ImageCarousel";
import { Txt, Row, Pill, Button, Loading, Card, ErrorState } from "../../src/components/ui";
import { useService } from "../../src/lib/queries";
import { serviceImages } from "../../src/lib/serviceImages";
import { useAuthGate } from "../../src/lib/useAuthGate";
import { inr } from "../../src/lib/format";
import { quote } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

const TRUST = [
  { icon: "shield-checkmark", label: "Verified pro" },
  { icon: "card", label: "Pay after service" },
  { icon: "refresh", label: "30-day warranty" },
];

export default function ServiceDetail() {
  const { slug } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useService(slug);
  const gate = useAuthGate();

  const service = data?.service;
  const q = service ? quote(service.basePrice) : null;

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Service details" />
      {isLoading ? (
        <Loading />
      ) : isError || !service ? (
        // Failed request or unknown slug — was an infinite spinner before.
        <ErrorState
          title={isError ? "Couldn't load this service" : "Service not available"}
          subtitle={
            isError
              ? "Check your internet connection and try again."
              : "This service may have been removed. Browse the latest services from home."
          }
          onRetry={isError ? refetch : undefined}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Photo gallery */}
            <ImageCarousel images={serviceImages(service)} category={service.category} />

            {/* Hero */}
            <View style={styles.hero}>
              {service.isPopular ? <Pill label="MOST BOOKED" tone="warning" /> : null}
              <Txt size={font.size.xxl} weight={font.weight.heavy} style={{ marginTop: service.isPopular ? spacing.sm : 0 }}>{service.name}</Txt>
              <Row gap={spacing.lg} style={{ marginTop: spacing.sm }}>
                <Row gap={5}><Ionicons name="time-outline" size={15} color={colors.textMuted} /><Txt muted size={font.size.sm}>~{service.estimatedDurationMinutes} min</Txt></Row>
                <Row gap={5}><Ionicons name="star" size={14} color={colors.gold} /><Txt muted size={font.size.sm}>4.8 (2.3k)</Txt></Row>
              </Row>
            </View>

            {/* Trust badges */}
            <Row justify="space-between" style={styles.trust}>
              {TRUST.map((t) => (
                <View key={t.label} style={{ alignItems: "center", flex: 1, gap: 6 }}>
                  <Ionicons name={t.icon} size={20} color={colors.ink} />
                  <Txt size={font.size.xs} muted weight={font.weight.medium} center>{t.label}</Txt>
                </View>
              ))}
            </Row>

            <View style={{ paddingHorizontal: spacing.xl }}>
              {service.description ? (
                <Txt muted style={{ lineHeight: 22, marginBottom: spacing.xl }}>{service.description}</Txt>
              ) : null}

              {/* What's included */}
              {service.whatIsIncluded?.length ? (
                <Card style={{ marginBottom: spacing.lg }}>
                  <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>What's included</Txt>
                  {service.whatIsIncluded.map((item, i) => (
                    <Row key={i} gap={spacing.sm} style={{ marginBottom: i < service.whatIsIncluded.length - 1 ? spacing.md : 0 }} align="flex-start">
                      <Ionicons name="checkmark-circle" size={19} color={colors.success} />
                      <Txt style={{ flex: 1 }}>{item}</Txt>
                    </Row>
                  ))}
                </Card>
              ) : null}

              {/* Price breakdown */}
              <Card>
                <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>Price estimate</Txt>
                <PriceRow label="Service charge" value={inr(q.base)} />
                <PriceRow label="Platform fee (10%)" value={inr(q.platformFee)} />
                <PriceRow label="GST (18%)" value={inr(q.tax)} />
                <View style={styles.divider} />
                <Row justify="space-between">
                  <Txt weight={font.weight.bold} size={font.size.md}>Total</Txt>
                  <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(q.total)}</Txt>
                </Row>
                <Txt faint size={font.size.xs} style={{ marginTop: 6 }}>Final amount confirmed before you pay. Coupons applied at checkout.</Txt>
              </Card>
            </View>
          </ScrollView>

          {/* Sticky CTA */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={{ flex: 1 }}>
              <Txt faint size={font.size.xs}>Total</Txt>
              <Txt weight={font.weight.heavy} size={font.size.xl}>{inr(q.total)}</Txt>
            </View>
            <Button
              title="Book now"
              fullWidth={false}
              style={{ paddingHorizontal: 40 }}
              onPress={onBook}
            />
          </View>
        </>
      )}
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
  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroIcon: { width: 96, height: 96, borderRadius: radii.xl, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  trust: { marginHorizontal: spacing.xl, marginBottom: spacing.xl, paddingVertical: spacing.lg, backgroundColor: colors.surfaceAlt, borderRadius: radii.lg },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  footer: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
});
