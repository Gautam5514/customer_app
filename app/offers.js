import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card, Button, Loading, ErrorState, EmptyState } from "../src/components/ui";
import { api, apiError } from "../src/lib/api";
import { colors, spacing, font, radii } from "../src/theme";

const HOW = [
  { icon: "search-outline",    text: "Pick a service and reach checkout" },
  { icon: "pricetag-outline",  text: "Type the code in “Have a coupon?”" },
  { icon: "checkmark-circle-outline", text: "Discount applies instantly to your total" },
];

function discountLabel(c) {
  return c.discountType === "percent" ? `${c.discountValue}% off` : `Flat ₹${c.discountValue} off`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function OfferCard({ coupon }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const terms = [
    coupon.minOrderValue > 0 ? `Min. order ₹${coupon.minOrderValue}` : null,
    `Valid till ${fmtDate(coupon.expiresAt)}`,
  ].filter(Boolean).join(" · ");

  return (
    <Card padded={false} style={{ overflow: "hidden", marginBottom: spacing.md }}>
      <View style={styles.offerTop}>
        <View style={{ flex: 1 }}>
          <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.lg}>{discountLabel(coupon)}</Txt>
          {coupon.description ? (
            <Txt color="rgba(255,255,255,0.7)" size={font.size.sm} style={{ marginTop: 1 }}>{coupon.description}</Txt>
          ) : null}
        </View>
        <Pressable onPress={copy} style={styles.codeChip}>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={12} color={colors.gold} />
          <Txt color={colors.gold} weight={font.weight.bold} size={font.size.sm} style={{ letterSpacing: 1.5 }}>
            {copied ? "Copied" : coupon.code}
          </Txt>
        </Pressable>
      </View>
      <Row justify="space-between" style={styles.offerBottom}>
        <Txt faint size={font.size.xs} style={{ flex: 1 }}>{terms}</Txt>
        <Txt weight={font.weight.semibold} size={font.size.xs} color={colors.ink}>Tap code to copy</Txt>
      </Row>
    </Card>
  );
}

export default function Offers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [coupons,    setCoupons]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try { setCoupons((await api.get("/coupons")).data.coupons || []); }
    catch (e) { setError(apiError(e, "Couldn't load offers.")); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><ScreenHeader title="Offers & coupons" /><Loading label="Loading offers…" /></View>;
  }

  if (error && coupons.length === 0) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><ScreenHeader title="Offers & coupons" /><ErrorState subtitle={error} onRetry={load} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Offers & coupons" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />}
      >
        {coupons.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title="No active offers right now"
            subtitle="Check back soon — new coupons show up here as soon as they go live."
          />
        ) : (
          coupons.map((c) => <OfferCard key={c._id} coupon={c} />)
        )}

        {/* How to use */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>How to use a code</Txt>
        <Card>
          {HOW.map((h, i) => (
            <Row key={h.text} gap={spacing.md} style={{ marginBottom: i < HOW.length - 1 ? spacing.md : 0 }}>
              <View style={styles.howIcon}><Ionicons name={h.icon} size={16} color={colors.ink} /></View>
              <Txt size={font.size.sm} style={{ flex: 1 }}>{h.text}</Txt>
            </Row>
          ))}
        </Card>

        <Button title="Browse services" style={{ marginTop: spacing.xl }} onPress={() => router.push("/(tabs)")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  offerTop: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.ink, padding: spacing.lg,
  },
  codeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "rgba(200,164,92,0.55)", borderStyle: "dashed",
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  offerBottom: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  label: { marginTop: spacing.lg, marginBottom: spacing.md },
  howIcon: { width: 32, height: 32, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
});
