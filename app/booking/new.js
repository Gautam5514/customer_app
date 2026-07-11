import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { CategoryBadge } from "../../src/components/CategoryIcon";
import { Txt, Row, Button, Input, Loading } from "../../src/components/ui";
import { PaymentWebView } from "../../src/components/PaymentWebView";
import { useAddresses, useCreateBooking } from "../../src/lib/queries";
import { fetchPaymentConfig, createPaymentOrder, verifyPayment } from "../../src/lib/payments";
import { apiError } from "../../src/lib/api";
import { inr, fmtTimeSlot, quote } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

// Slots carry their day-part so the grid can show "9:00 AM · Morning", with a
// coloured glyph per part (sun / dusk / moon) so times scan at a glance.
const TIME_SLOTS = [
  { time: "09:00", part: "Morning", icon: "sunny", tint: "#D97706" },
  { time: "11:00", part: "Morning", icon: "sunny", tint: "#D97706" },
  { time: "13:00", part: "Afternoon", icon: "partly-sunny", tint: "#EA580C" },
  { time: "15:00", part: "Afternoon", icon: "partly-sunny", tint: "#EA580C" },
  { time: "17:00", part: "Evening", icon: "moon", tint: "#6366F1" },
  { time: "19:00", part: "Evening", icon: "moon", tint: "#6366F1" },
];

// Address labels get their own accent so Home/Work/Other tiles read apart.
const ADDR_TONES = {
  Home: { icon: "home", color: colors.success, bg: colors.successSoft },
  Work: { icon: "briefcase", color: colors.info, bg: colors.infoSoft },
  Other: { icon: "location", color: "#7C5CFC", bg: "#EEEAFE" },
};

export default function NewBooking() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: addrData, isLoading: addrLoading } = useAddresses();
  const create = useCreateBooking();

  const basePrice = Number(params.basePrice || 0);

  const addresses = addrData?.addresses || [];
  const [addressId, setAddressId] = useState(null);
  const [date, setDate] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [error, setError] = useState(null);

  // Payment: default to online; fall back to COD-only if unconfigured.
  const [payMethod, setPayMethod] = useState("online");
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [paying, setPaying] = useState(false);       // creating booking / order
  const [payData, setPayData] = useState(null);      // { order, keyId, prefill, bookingId } while checkout is open

  useEffect(() => {
    let alive = true;
    fetchPaymentConfig()
      .then((cfg) => { if (alive && !cfg?.enabled) { setOnlineEnabled(false); setPayMethod("cash_on_delivery"); } })
      .catch(() => { if (alive) { setOnlineEnabled(false); setPayMethod("cash_on_delivery"); } });
    return () => { alive = false; };
  }, []);

  // Default to the user's default address once loaded.
  const selectedAddress = useMemo(() => {
    if (addressId) return addresses.find((a) => a._id === addressId);
    return addresses.find((a) => a.isDefault) || addresses[0];
  }, [addresses, addressId]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayjs().add(i, "day")),
    []
  );

  const q = quote(basePrice);

  const method = onlineEnabled ? payMethod : "cash_on_delivery";

  async function confirm() {
    setError(null);
    if (!selectedAddress) return setError("Add a service address to continue.");
    if (!slot) return setError("Pick a time slot.");

    setPaying(true);
    try {
      const payload = {
        serviceCategory: params.category,
        serviceName: params.name,
        serviceSlug: params.slug,
        scheduledDate: dayjs(date).toISOString(),
        scheduledTimeSlot: slot,
        address: {
          text: selectedAddress.fullAddress,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
        },
        pricing: { basePrice },
        customerNote: note.trim(),
        paymentMethod: method,
        ...(coupon.trim() ? { couponCode: coupon.trim() } : {}),
      };
      const res = await create.mutateAsync(payload);
      const id = res?.booking?._id;

      if (method === "online") {
        // Create the Razorpay order, then open the hosted checkout.
        const order = await createPaymentOrder(id);
        if (!order?.success) throw new Error(order?.message || "Couldn't start the payment.");
        setPayData({ bookingId: id, order: order.order, keyId: order.keyId, prefill: order.prefill });
        // Result handled in onPaymentResult(); keep `paying` true until then.
        return;
      }

      router.replace({ pathname: "/booking/[id]", params: { id, justBooked: "1" } });
    } catch (e) {
      setError(apiError(e));
    } finally {
      // For online, the modal is now open — keep the button spinner only while
      // we're still setting up. Once payData is set, the modal drives the UI.
      if (method !== "online") setPaying(false);
      else if (!error) { /* modal open; stop the inline spinner */ setPaying(false); }
    }
  }

  // Called by the checkout modal with the payment outcome.
  async function onPaymentResult(result) {
    const target = payData;
    setPayData(null); // close the modal

    if (!target) return;

    // Cancelled or failed — the booking exists (unpaid). Take the customer to it
    // so they can retry payment there instead of losing the booking.
    if (result.status === "dismissed" || result.status === "failed" || result.status === "error") {
      router.replace({ pathname: "/booking/[id]", params: { id: target.bookingId, justBooked: "1" } });
      return;
    }

    // Success — confirm the signature with our server before trusting it.
    try {
      setPaying(true);
      const verify = await verifyPayment({
        bookingId: target.bookingId,
        razorpay_order_id: result.payment.razorpay_order_id,
        razorpay_payment_id: result.payment.razorpay_payment_id,
        razorpay_signature: result.payment.razorpay_signature,
      });
      if (!verify?.success) throw new Error(verify?.message || "We couldn't confirm your payment.");
      router.replace({ pathname: "/booking/[id]", params: { id: target.bookingId, justPaid: "1" } });
    } catch (e) {
      // Money may be captured but verify failed — send them to the booking,
      // which will show a "Pay now / payment pending" state they can resolve.
      setError(apiError(e));
      router.replace({ pathname: "/booking/[id]", params: { id: target.bookingId } });
    } finally {
      setPaying(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Confirm booking" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Service strip — what you're booking, at a glance ── */}
        <View style={styles.serviceStrip}>
          <CategoryBadge category={params.category} size={46} iconSize={23} />
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.bold} size={font.size.md} numberOfLines={1}>{params.name}</Txt>
            <Row gap={4} style={{ marginTop: 3 }}>
              <Ionicons name="shield-checkmark" size={12} color={colors.success} />
              <Txt muted size={font.size.xs}>Verified pro · 30-day warranty</Txt>
            </Row>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Txt weight={font.weight.heavy} size={font.size.md}>{inr(basePrice)}</Txt>
            <Txt faint size={font.size.xs}>base price</Txt>
          </View>
        </View>

        {/* ── 1 · Address ── */}
        <Section n="1" title="Where should the pro come?">
          {addrLoading ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <Pressable onPress={() => router.push("/addresses")} style={styles.addAddr}>
              <Ionicons name="add-circle-outline" size={20} color={colors.ink} />
              <Txt weight={font.weight.semibold}>Add a service address</Txt>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {addresses.map((a) => {
                const active = selectedAddress?._id === a._id;
                const tone = ADDR_TONES[a.label] || ADDR_TONES.Other;
                return (
                  <Pressable key={a._id} onPress={() => setAddressId(a._id)} style={[styles.addrTile, active && styles.tileActive]}>
                    <Row justify="space-between">
                      <Row gap={7}>
                        <View style={[styles.addrIconChip, { backgroundColor: tone.bg }]}>
                          <Ionicons name={tone.icon} size={12} color={tone.color} />
                        </View>
                        <Txt weight={font.weight.bold} size={font.size.sm}>{a.label}</Txt>
                      </Row>
                      <Ionicons
                        name={active ? "checkmark-circle" : "ellipse-outline"}
                        size={18}
                        color={active ? colors.success : colors.borderStrong}
                      />
                    </Row>
                    <Txt muted size={font.size.xs} numberOfLines={2} style={{ marginTop: 6, lineHeight: 16 }}>
                      {a.fullAddress}, {a.city}
                    </Txt>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => router.push("/addresses")} style={styles.addTile}>
                <Ionicons name="add" size={22} color={colors.ink} />
                <Txt weight={font.weight.semibold} size={font.size.xs}>Add new</Txt>
              </Pressable>
            </ScrollView>
          )}
        </Section>

        {/* ── 2 · Schedule ── */}
        <Section n="2" title="When works for you?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {days.map((d, i) => {
              const key = d.format("YYYY-MM-DD");
              const active = key === date;
              const dayLabel = i === 0 ? "Today" : i === 1 ? "Tmrw" : d.format("ddd");
              return (
                <Pressable key={key} onPress={() => setDate(key)} style={[styles.dayCell, active && styles.dayActive]}>
                  <Txt size={font.size.xs} color={active ? "rgba(255,255,255,0.7)" : colors.textMuted} weight={font.weight.medium}>{dayLabel}</Txt>
                  <Txt size={font.size.lg} weight={font.weight.bold} color={active ? colors.textOnInk : colors.text}>{d.format("D")}</Txt>
                  <Txt size={font.size.xs} color={active ? "rgba(255,255,255,0.7)" : colors.textFaint}>{d.format("MMM")}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Slot grid — time + coloured day-part glyph in each cell */}
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((s) => {
              const active = slot === s.time;
              return (
                <Pressable key={s.time} onPress={() => setSlot(s.time)} style={[styles.slotCell, active && styles.slotActive]}>
                  <Txt weight={font.weight.bold} size={font.size.sm} color={active ? colors.textOnInk : colors.text}>
                    {fmtTimeSlot(s.time)}
                  </Txt>
                  <Row gap={3} style={{ marginTop: 2 }}>
                    <Ionicons name={s.icon} size={10} color={active ? "rgba(255,255,255,0.8)" : s.tint} />
                    <Txt size={font.size.xs} color={active ? "rgba(255,255,255,0.65)" : colors.textFaint}>
                      {s.part}
                    </Txt>
                  </Row>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Extras — collapsed utility rows, expand on demand ── */}
        <View style={styles.extras}>
          <Pressable onPress={() => setShowNote((v) => !v)} style={styles.extraRow}>
            <View style={[styles.extraIcon, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="create-outline" size={15} color={colors.info} />
            </View>
            <Txt weight={font.weight.semibold} size={font.size.sm} style={{ flex: 1 }}>
              {note.trim() ? "Note for the pro added" : "Add a note for the pro"}
            </Txt>
            {note.trim() ? <Ionicons name="checkmark-circle" size={16} color={colors.success} /> : null}
            <Ionicons name={showNote ? "chevron-up" : "chevron-down"} size={16} color={colors.textFaint} />
          </Pressable>
          {showNote ? (
            <View style={styles.extraBody}>
              <Input placeholder="e.g. Outdoor unit on the balcony, gate code 1234" value={note} onChangeText={setNote} multiline maxLength={300} />
            </View>
          ) : null}

          <View style={styles.extraDivider} />

          <Pressable onPress={() => setShowCoupon((v) => !v)} style={styles.extraRow}>
            <View style={[styles.extraIcon, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="pricetag-outline" size={15} color={colors.gold} />
            </View>
            <Txt weight={font.weight.semibold} size={font.size.sm} style={{ flex: 1 }}>
              {coupon.trim() ? `Coupon ${coupon.trim()}` : "Apply a coupon"}
            </Txt>
            {coupon.trim() ? <Ionicons name="checkmark-circle" size={16} color={colors.success} /> : null}
            <Ionicons name={showCoupon ? "chevron-up" : "chevron-down"} size={16} color={colors.textFaint} />
          </Pressable>
          {showCoupon ? (
            <View style={styles.extraBody}>
              <Input placeholder="Enter code (e.g. ELITE100)" value={coupon} onChangeText={(t) => setCoupon(t.toUpperCase())} autoCapitalize="characters" />
            </View>
          ) : null}
        </View>

        {/* ── 3 · Payment ── */}
        <Section n="3" title="How would you like to pay?">
          <Row gap={spacing.sm} align="stretch">
            {onlineEnabled ? (
              <PayTile
                active={method === "online"}
                icon="flash"
                title="Pay online"
                sub="UPI · cards · netbanking"
                tag="RECOMMENDED"
                color={colors.success}
                bg={colors.successSoft}
                onPress={() => setPayMethod("online")}
              />
            ) : null}
            <PayTile
              active={method === "cash_on_delivery"}
              icon="cash-outline"
              title="Pay after service"
              sub="Cash or UPI at the door"
              color={colors.warning}
              bg={colors.warningSoft}
              onPress={() => setPayMethod("cash_on_delivery")}
            />
          </Row>
        </Section>

        {/* ── Bill ── */}
        <View style={styles.billCard}>
          <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>Bill summary</Txt>
          <PriceRow label="Service charge" value={inr(q.base)} />
          <PriceRow label="Platform fee" value={inr(q.platformFee)} />
          <PriceRow label="GST (18%)" value={inr(q.tax)} />
          {coupon.trim() ? <PriceRow label={`Coupon ${coupon.trim()}`} value="applied at checkout" green /> : null}
          <View style={styles.billDivider} />
          <Row justify="space-between">
            <Txt weight={font.weight.bold} size={font.size.md}>Total payable</Txt>
            <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(q.total)}</Txt>
          </Row>
          <Row gap={5} style={[styles.billNote, { backgroundColor: method === "online" ? colors.successSoft : colors.warningSoft }]}>
            <Ionicons
              name={method === "online" ? "lock-closed" : "hand-left-outline"}
              size={11}
              color={method === "online" ? colors.success : colors.warning}
            />
            <Txt size={font.size.xs} weight={font.weight.semibold} color={method === "online" ? colors.success : colors.warning}>
              {method === "online" ? "Secured by Razorpay · 256-bit encryption" : "Nothing charged now — pay once the job is done"}
            </Txt>
          </Row>
        </View>

        {error ? (
          <Row gap={8} style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={17} color={colors.danger} />
            <Txt color={colors.danger} size={font.size.sm} weight={font.weight.medium} style={{ flex: 1 }}>{error}</Txt>
          </Row>
        ) : null}
      </ScrollView>

      {/* Sticky confirm — total on the left, action on the right */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Txt faint size={font.size.xs}>Total</Txt>
          <Txt weight={font.weight.heavy} size={font.size.xl}>{inr(q.total)}</Txt>
        </View>
        <Button
          title={method === "online" ? "Pay securely" : "Confirm booking"}
          rightIcon="arrow-forward"
          fullWidth={false}
          style={{ paddingHorizontal: 26 }}
          onPress={confirm}
          loading={create.isPending || paying}
        />
      </View>

      {/* Razorpay hosted checkout */}
      <PaymentWebView
        visible={!!payData}
        order={payData?.order}
        keyId={payData?.keyId}
        prefill={payData?.prefill}
        description={params.name}
        onResult={onPaymentResult}
      />
    </KeyboardAvoidingView>
  );
}

// Numbered checkout section — "1 · Where should the pro come?" etc.
function Section({ n, title, children }) {
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <View style={sectionStyles.num}>
          <Txt color={colors.textOnInk} size={font.size.xs} weight={font.weight.bold}>{n}</Txt>
        </View>
        <Txt weight={font.weight.bold} size={font.size.md}>{title}</Txt>
      </Row>
      {children}
    </View>
  );
}

// Payment tile with a semantic accent — green for online (secure/instant),
// amber for pay-after-service. Selecting floods the tile with its soft tint.
function PayTile({ active, icon, title, sub, tag, color, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[sectionStyles.payTile, active && { borderColor: color, backgroundColor: bg }]}
    >
      <Row justify="space-between">
        <View style={[sectionStyles.payIcon, { backgroundColor: active ? color : bg }]}>
          <Ionicons name={icon} size={16} color={active ? "#FFFFFF" : color} />
        </View>
        <Ionicons
          name={active ? "checkmark-circle" : "ellipse-outline"}
          size={18}
          color={active ? color : colors.borderStrong}
        />
      </Row>
      <Txt weight={font.weight.bold} size={font.size.sm} style={{ marginTop: spacing.sm }}>{title}</Txt>
      <Txt muted size={font.size.xs} style={{ marginTop: 2 }}>{sub}</Txt>
      {tag ? (
        <View style={[sectionStyles.payTag, { backgroundColor: active ? color : bg }]}>
          <Txt size={9} weight={font.weight.heavy} color={active ? "#FFFFFF" : color} style={{ letterSpacing: 0.8 }}>
            {tag}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

function PriceRow({ label, value, green }) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
      <Txt muted size={font.size.sm}>{label}</Txt>
      <Txt size={font.size.sm} weight={font.weight.medium} color={green ? colors.success : colors.text}>{value}</Txt>
    </Row>
  );
}

const sectionStyles = StyleSheet.create({
  num: {
    width: 20, height: 20, borderRadius: 6, backgroundColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  payTile: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.md, backgroundColor: colors.surface,
  },
  payIcon: {
    width: 30, height: 30, borderRadius: radii.sm,
    alignItems: "center", justifyContent: "center",
  },
  payTag: {
    alignSelf: "flex-start", borderRadius: radii.pill,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: spacing.sm,
  },
});

const styles = StyleSheet.create({
  serviceStrip: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.md, backgroundColor: colors.surface,
  },

  addAddr: { flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.lg, borderRadius: radii.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.borderStrong },
  addrTile: {
    width: 200, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: spacing.md, backgroundColor: colors.surface,
  },
  tileActive: { borderColor: colors.success, backgroundColor: colors.successSoft },
  addrIconChip: {
    width: 24, height: 24, borderRadius: radii.sm - 2,
    alignItems: "center", justifyContent: "center",
  },
  addTile: {
    width: 84, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.borderStrong,
    borderRadius: radii.lg, alignItems: "center", justifyContent: "center", gap: 4,
  },

  dayCell: { width: 58, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: "center", gap: 2, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dayActive: { backgroundColor: colors.ink, borderColor: colors.ink },

  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  slotCell: {
    flexBasis: "31%", flexGrow: 1, alignItems: "center", paddingVertical: spacing.md,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.ink, borderColor: colors.ink },

  extras: {
    marginTop: spacing.xxl, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, backgroundColor: colors.surface,
  },
  extraRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, paddingHorizontal: spacing.lg },
  extraIcon: {
    width: 30, height: 30, borderRadius: radii.sm,
    alignItems: "center", justifyContent: "center",
  },
  extraBody: { paddingHorizontal: spacing.lg, marginBottom: -spacing.sm },
  extraDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },

  billCard: {
    marginTop: spacing.xxl, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, padding: spacing.lg, backgroundColor: colors.surface,
  },
  billDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  billNote: {
    marginTop: spacing.md, alignSelf: "flex-start", alignItems: "center",
    borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5,
  },

  errorBanner: {
    marginTop: spacing.lg, backgroundColor: colors.dangerSoft,
    borderRadius: radii.md, padding: spacing.md, alignItems: "center",
  },

  footer: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
});
