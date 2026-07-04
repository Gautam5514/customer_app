import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { CategoryBadge } from "../../src/components/CategoryIcon";
import { Txt, Row, Card, Button, Input, Chip, Pill, Loading } from "../../src/components/ui";
import { PaymentWebView } from "../../src/components/PaymentWebView";
import { useAddresses, useCreateBooking } from "../../src/lib/queries";
import { fetchPaymentConfig, createPaymentOrder, verifyPayment } from "../../src/lib/payments";
import { apiError } from "../../src/lib/api";
import { inr, fmtTimeSlot, quote } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];

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
  const [coupon, setCoupon] = useState("");
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
        {/* Service summary */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Row gap={spacing.md}>
            <CategoryBadge category={params.category} size={50} iconSize={24} />
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.bold} size={font.size.md}>{params.name}</Txt>
              <Txt muted size={font.size.sm} style={{ marginTop: 2 }}>Verified pro · transparent pricing</Txt>
            </View>
          </Row>
        </Card>

        {/* Address */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Service address</Txt>
        {addrLoading ? (
          <Loading />
        ) : addresses.length === 0 ? (
          <Pressable onPress={() => router.push("/addresses")} style={styles.addAddr}>
            <Ionicons name="add-circle-outline" size={20} color={colors.ink} />
            <Txt weight={font.weight.semibold}>Add a service address</Txt>
          </Pressable>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {addresses.map((a) => {
              const active = selectedAddress?._id === a._id;
              return (
                <Pressable key={a._id} onPress={() => setAddressId(a._id)} style={[styles.addrRow, active && styles.addrActive]}>
                  <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? colors.ink : colors.textFaint} />
                  <View style={{ flex: 1 }}>
                    <Row gap={6}><Txt weight={font.weight.semibold} size={font.size.sm}>{a.label}</Txt>{a.isDefault ? <Pill label="DEFAULT" tone="neutral" /> : null}</Row>
                    <Txt muted size={font.size.sm} numberOfLines={1} style={{ marginTop: 2 }}>{a.fullAddress}, {a.city}</Txt>
                  </View>
                </Pressable>
              );
            })}
            <Pressable onPress={() => router.push("/addresses")} hitSlop={6} style={{ paddingVertical: 6 }}>
              <Txt color={colors.ink} weight={font.weight.semibold} size={font.size.sm}>+ Add another address</Txt>
            </Pressable>
          </View>
        )}

        {/* Date */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Pick a date</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {days.map((d) => {
            const key = d.format("YYYY-MM-DD");
            const active = key === date;
            return (
              <Pressable key={key} onPress={() => setDate(key)} style={[styles.dayCell, active && styles.dayActive]}>
                <Txt size={font.size.xs} color={active ? "rgba(255,255,255,0.7)" : colors.textMuted} weight={font.weight.medium}>{d.format("ddd")}</Txt>
                <Txt size={font.size.lg} weight={font.weight.bold} color={active ? colors.textOnInk : colors.text}>{d.format("D")}</Txt>
                <Txt size={font.size.xs} color={active ? "rgba(255,255,255,0.7)" : colors.textFaint}>{d.format("MMM")}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time slot */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Pick a time</Txt>
        <Row gap={spacing.sm} style={{ flexWrap: "wrap" }}>
          {TIME_SLOTS.map((s) => (
            <Chip key={s} label={fmtTimeSlot(s)} selected={slot === s} onPress={() => setSlot(s)} />
          ))}
        </Row>

        {/* Note */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Notes for the pro <Txt muted size={font.size.sm}>(optional)</Txt></Txt>
        <Input placeholder="e.g. Outdoor unit on the balcony, gate code 1234" value={note} onChangeText={setNote} multiline maxLength={300} />

        {/* Coupon */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Have a coupon?</Txt>
        <Input placeholder="Enter code (e.g. ELITE100)" value={coupon} onChangeText={(t) => setCoupon(t.toUpperCase())} autoCapitalize="characters" />

        {/* Payment method */}
        <Txt weight={font.weight.bold} size={font.size.md} style={styles.label}>Payment method</Txt>
        <View style={{ gap: spacing.sm }}>
          {onlineEnabled ? (
            <Pressable onPress={() => setPayMethod("online")} style={[styles.payRow, method === "online" && styles.payActive]}>
              <Ionicons name={method === "online" ? "radio-button-on" : "radio-button-off"} size={20} color={method === "online" ? colors.ink : colors.textFaint} />
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.semibold}>Pay online</Txt>
                <Txt muted size={font.size.sm}>UPI, cards, netbanking · secure</Txt>
              </View>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => setPayMethod("cash_on_delivery")} style={[styles.payRow, method === "cash_on_delivery" && styles.payActive]}>
            <Ionicons name={method === "cash_on_delivery" ? "radio-button-on" : "radio-button-off"} size={20} color={method === "cash_on_delivery" ? colors.ink : colors.textFaint} />
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.semibold}>Cash on delivery</Txt>
              <Txt muted size={font.size.sm}>Pay after the job is done</Txt>
            </View>
            <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Price summary */}
        <Card>
          <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>Bill summary</Txt>
          <PriceRow label="Service charge" value={inr(q.base)} />
          <PriceRow label="Platform fee" value={inr(q.platformFee)} />
          <PriceRow label="GST (18%)" value={inr(q.tax)} />
          {coupon.trim() ? <PriceRow label={`Coupon ${coupon.trim()}`} value="applied at checkout" muted /> : null}
          <View style={styles.divider} />
          <Row justify="space-between">
            <Txt weight={font.weight.bold} size={font.size.md}>Total payable</Txt>
            <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(q.total)}</Txt>
          </Row>
        </Card>

        {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginTop: spacing.md }}>{error}</Txt> : null}
      </ScrollView>

      {/* Sticky confirm */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={(method === "online") ? `Pay ${inr(q.total)}` : `Confirm · ${inr(q.total)}`}
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

function PriceRow({ label, value, muted }) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
      <Txt muted size={font.size.sm}>{label}</Txt>
      <Txt size={font.size.sm} weight={font.weight.medium} color={muted ? colors.success : colors.text}>{value}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  icon: { width: 50, height: 50, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  label: { marginTop: spacing.xl, marginBottom: spacing.md },
  addAddr: { flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.lg, borderRadius: radii.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.borderStrong },
  addrRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  addrActive: { borderColor: colors.ink, backgroundColor: colors.surfaceAlt },
  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  payActive: { borderColor: colors.ink, backgroundColor: colors.surfaceAlt },
  dayCell: { width: 60, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: "center", gap: 2, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dayActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
});
