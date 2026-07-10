import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { CategoryBadge } from "../../src/components/CategoryIcon";
import { Txt, Row, Card, Button, Pill, Loading } from "../../src/components/ui";
import { PaymentWebView } from "../../src/components/PaymentWebView";
import { useBooking, useCancelBooking } from "../../src/lib/queries";
import { createPaymentOrder, verifyPayment } from "../../src/lib/payments";
import { apiError } from "../../src/lib/api";
import { getCachedToken } from "../../src/lib/token";
import { API_BASE } from "../../src/lib/config";
import { inr, fmtDate, fmtTimeSlot } from "../../src/lib/format";
import { colors, spacing, font, radii, statusMeta } from "../../src/theme";

const FLOW = [
  { key: "pending", label: "Request placed", desc: "Finding a verified pro near you" },
  { key: "accepted", label: "Pro assigned", desc: "A technician accepted your job" },
  { key: "provider_on_way", label: "On the way", desc: "Your pro is heading over" },
  { key: "in_progress", label: "Work in progress", desc: "Service underway" },
  { key: "completed", label: "Completed", desc: "Job done — hope it's perfect!" },
];
const ORDER = FLOW.map((f) => f.key);
const CANCELLABLE = ["pending", "accepted"];

export default function BookingDetail() {
  const { id, justBooked, justPaid } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useBooking(id);
  const cancel = useCancelBooking();

  const [payData, setPayData] = useState(null); // { order, keyId, prefill } while checkout open
  const [paying, setPaying]   = useState(false);
  const [payError, setPayError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const booking = data?.booking;
  if (isLoading || !booking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Booking" />
        <Loading label="Loading booking…" />
      </View>
    );
  }

  const meta = statusMeta[booking.status] || { label: booking.status, tone: "neutral" };
  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const provider = booking.providerId;
  const providerUser = provider?.userId;
  const currentIndex = ORDER.indexOf(booking.status);

  // Online booking that hasn't been paid (e.g. checkout was dismissed) → offer
  // a retry. COD settles at completion, so it's excluded.
  const needsPayment = booking.paymentMethod === "online"
    && booking.paymentStatus === "unpaid"
    && !isCancelled && !["disputed"].includes(booking.status);

  async function startPayment() {
    setPayError(null);
    setPaying(true);
    try {
      const order = await createPaymentOrder(id);
      if (!order?.success) throw new Error(order?.message || "Couldn't start the payment.");
      setPayData({ order: order.order, keyId: order.keyId, prefill: order.prefill });
    } catch (e) {
      setPayError(apiError(e));
    } finally {
      setPaying(false);
    }
  }

  async function onPaymentResult(result) {
    setPayData(null);
    if (result.status === "dismissed") { setPayError("Payment cancelled. You can pay anytime."); return; }
    if (result.status === "failed" || result.status === "error") {
      setPayError(result.error || "Payment failed. Please try again.");
      return;
    }
    try {
      setPaying(true);
      const verify = await verifyPayment({
        bookingId: id,
        razorpay_order_id: result.payment.razorpay_order_id,
        razorpay_payment_id: result.payment.razorpay_payment_id,
        razorpay_signature: result.payment.razorpay_signature,
      });
      if (!verify?.success) throw new Error(verify?.message || "We couldn't confirm your payment.");
      refetch();
    } catch (e) {
      setPayError(apiError(e));
    } finally {
      setPaying(false);
    }
  }

  async function onDownloadInvoice() {
    setDownloadError(null);
    setDownloading(true);
    try {
      const token = getCachedToken();
      const fileUri = `${FileSystem.documentDirectory}invoice-${booking.bookingNumber}.pdf`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE}/bookings/${id}/invoice`,
        fileUri,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (result.status !== 200) throw new Error("Download failed");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: "Invoice" });
      }
    } catch (e) {
      setDownloadError(apiError(e, "Couldn't download invoice. Please try again."));
    } finally {
      setDownloading(false);
    }
  }

  function onCancel() {
    Alert.alert("Cancel booking", "Are you sure you want to cancel this service?", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel booking", style: "destructive",
        onPress: () => cancel.mutate({ id, reason: "Cancelled by customer" }),
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={`#${booking.bookingNumber}`} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.ink} />}
      >
        {(justPaid === "1" || justBooked === "1") ? (
          <Card style={styles.success} elevated={false}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Txt color={colors.success} weight={font.weight.semibold} style={{ flex: 1 }}>
              {justPaid === "1"
                ? "Payment successful! Your booking is confirmed."
                : "Booking confirmed! We're notifying nearby pros now."}
            </Txt>
          </Card>
        ) : null}

        {/* Pay-now — unpaid online booking (e.g. checkout was dismissed) */}
        {needsPayment ? (
          <Card style={[styles.payDue, { marginBottom: spacing.lg }]} elevated={false}>
            <Row justify="space-between" align="center" style={{ marginBottom: spacing.sm }}>
              <Row gap={spacing.sm}>
                <Ionicons name="card" size={18} color={colors.gold} />
                <Txt color={colors.textOnInk} weight={font.weight.bold}>Payment pending</Txt>
              </Row>
              <Txt color={colors.textOnInk} weight={font.weight.heavy}>{inr(booking.pricing?.totalAmount)}</Txt>
            </Row>
            <Txt color="rgba(255,255,255,0.7)" size={font.size.sm} style={{ marginBottom: spacing.md }}>
              Complete your secure payment to confirm this booking.
            </Txt>
            <Button
              title={paying ? "Processing…" : `Pay ${inr(booking.pricing?.totalAmount)}`}
              onPress={startPayment}
              loading={paying}
              variant="secondary"
            />
          </Card>
        ) : null}

        {payError ? (
          <Card style={[styles.payErr, { marginBottom: spacing.lg }]} elevated={false}>
            <Ionicons name="information-circle" size={18} color={colors.danger} />
            <Txt color={colors.danger} size={font.size.sm} style={{ flex: 1 }}>{payError}</Txt>
          </Card>
        ) : null}

        {/* Header card */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Row justify="space-between" align="flex-start">
            <Row gap={spacing.md} style={{ flex: 1 }}>
              <CategoryBadge category={booking.serviceCategory} size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.bold} size={font.size.md}>{booking.serviceName}</Txt>
                <Txt muted size={font.size.sm} style={{ marginTop: 2 }}>{fmtDate(booking.scheduledDate)} · {fmtTimeSlot(booking.scheduledTimeSlot)}</Txt>
              </View>
            </Row>
            <Pill label={meta.label} tone={meta.tone} dot />
          </Row>
        </Card>

        {/* Live status banner */}
        {booking.status === "provider_on_way" ? (
          <Card style={[styles.live, { marginBottom: spacing.lg }]} elevated={false}>
            <Ionicons name="navigate-circle" size={26} color={colors.textOnInk} />
            <View style={{ flex: 1 }}>
              <Txt color={colors.textOnInk} weight={font.weight.bold}>Your pro is on the way</Txt>
              <Txt color="rgba(255,255,255,0.7)" size={font.size.sm}>
                {booking.providerLocation?.updatedAt ? "Live location updating…" : "Sit tight — arriving soon"}
              </Txt>
            </View>
          </Card>
        ) : null}

        {/* Completion OTP — customer shares with the pro to start/finish */}
        {(booking.status === "accepted" || booking.status === "provider_on_way" || booking.status === "in_progress") && booking.completionOtp ? (
          <Card style={[styles.otp, { marginBottom: spacing.lg }]} elevated={false}>
            <Txt color={colors.warning} weight={font.weight.semibold} size={font.size.sm}>SHARE THIS CODE WITH YOUR PRO</Txt>
            <Txt color={colors.ink} weight={font.weight.heavy} style={{ fontSize: 34, letterSpacing: 8, marginTop: 6 }}>{booking.completionOtp}</Txt>
            <Txt muted size={font.size.xs} style={{ marginTop: 4 }}>They'll enter it to start the job. Don't share until they arrive.</Txt>
          </Card>
        ) : null}

        {/* Provider card */}
        {providerUser ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <Txt faint size={font.size.xs} weight={font.weight.semibold} style={{ marginBottom: spacing.md }}>YOUR PROFESSIONAL</Txt>
            <Row justify="space-between">
              <Row gap={spacing.md} style={{ flex: 1 }}>
                <View style={styles.avatar}><Ionicons name="person" size={22} color={colors.ink} /></View>
                <View style={{ flex: 1 }}>
                  <Txt weight={font.weight.bold}>{providerUser.fullName}</Txt>
                  <Row gap={4} style={{ marginTop: 2 }}><Ionicons name="star" size={13} color={colors.gold} /><Txt muted size={font.size.sm}>Verified EliteCrew pro</Txt></Row>
                </View>
              </Row>
              {providerUser.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${providerUser.phone}`)} style={styles.callBtn}>
                  <Ionicons name="call" size={18} color={colors.textOnInk} />
                </Pressable>
              ) : null}
            </Row>
          </Card>
        ) : null}

        {/* Timeline */}
        {!isCancelled ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.lg }}>Status</Txt>
            {FLOW.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <Row key={step.key} align="flex-start" gap={spacing.md} style={{ marginBottom: i < FLOW.length - 1 ? 0 : 0 }}>
                  <View style={{ alignItems: "center" }}>
                    <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                      {done ? <Ionicons name="checkmark" size={13} color={colors.textOnInk} /> : active ? <View style={styles.pulse} /> : null}
                    </View>
                    {i < FLOW.length - 1 ? <View style={[styles.line, (done || active) && { backgroundColor: colors.ink }]} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Txt weight={active ? font.weight.bold : font.weight.medium} color={done || active ? colors.text : colors.textFaint}>{step.label}</Txt>
                    <Txt size={font.size.sm} color={active ? colors.textMuted : colors.textFaint} style={{ marginTop: 1 }}>{step.desc}</Txt>
                  </View>
                </Row>
              );
            })}
          </Card>
        ) : (
          <Card style={[styles.cancelledBox, { marginBottom: spacing.lg }]} elevated={false}>
            <Ionicons name="close-circle" size={22} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Txt color={colors.danger} weight={font.weight.bold}>Booking cancelled</Txt>
              {booking.cancelReason ? <Txt muted size={font.size.sm} style={{ marginTop: 2 }}>{booking.cancelReason}</Txt> : null}
            </View>
          </Card>
        )}

        {/* Address */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Row gap={spacing.sm} style={{ marginBottom: 6 }}><Ionicons name="location" size={16} color={colors.ink} /><Txt weight={font.weight.bold} size={font.size.sm}>Service address</Txt></Row>
          <Txt muted style={{ lineHeight: 20 }}>{booking.address?.text}</Txt>
          <Txt faint size={font.size.sm}>{booking.address?.city}{booking.address?.pincode ? ` · ${booking.address.pincode}` : ""}</Txt>
        </Card>

        {/* Bill */}
        <Card>
          <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>Bill details</Txt>
          <PriceRow label="Service charge" value={inr(booking.pricing?.basePrice)} />
          <PriceRow label="Platform fee" value={inr(booking.pricing?.platformFee)} />
          <PriceRow label="GST" value={inr(booking.pricing?.tax)} />
          {booking.pricing?.discount ? <PriceRow label="Discount" value={`- ${inr(booking.pricing.discount)}`} positive /> : null}
          <View style={styles.divider} />
          <Row justify="space-between">
            <Txt weight={font.weight.bold}>Total · {booking.paymentMethod === "online" ? "Online" : "Cash/UPI"}</Txt>
            <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(booking.pricing?.totalAmount)}</Txt>
          </Row>
        </Card>

        {/* Invoice */}
        {isCompleted ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
              <Ionicons name="document-text-outline" size={16} color={colors.ink} />
              <Txt weight={font.weight.bold} size={font.size.md}>Invoice</Txt>
            </Row>
            <Txt size={font.size.sm} muted style={{ marginBottom: spacing.md }}>
              Download your tax invoice for this booking.
            </Txt>
            {downloadError ? (
              <Txt size={font.size.xs} color={colors.danger} style={{ marginBottom: spacing.sm }}>{downloadError}</Txt>
            ) : null}
            <Button title="Download Invoice" variant="secondary" loading={downloading} onPress={onDownloadInvoice} />
          </Card>
        ) : null}

        {/* Actions */}
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {isCompleted && !booking.isRated ? (
            <Button title="Rate your experience" onPress={() => router.push(`/rate/${booking._id}`)} />
          ) : null}
          {CANCELLABLE.includes(booking.status) ? (
            <Button title="Cancel booking" variant="danger" onPress={onCancel} loading={cancel.isPending} />
          ) : null}
        </View>
      </ScrollView>

      {/* Razorpay hosted checkout */}
      <PaymentWebView
        visible={!!payData}
        order={payData?.order}
        keyId={payData?.keyId}
        prefill={payData?.prefill}
        description={booking.serviceName}
        onResult={onPaymentResult}
      />
    </View>
  );
}

function PriceRow({ label, value, positive }) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
      <Txt muted size={font.size.sm}>{label}</Txt>
      <Txt size={font.size.sm} weight={font.weight.medium} color={positive ? colors.success : colors.text}>{value}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  success: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.successSoft, borderColor: colors.successSoft, marginBottom: spacing.lg },
  payDue: { backgroundColor: colors.ink, borderColor: colors.ink },
  payErr: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
  icon: { width: 50, height: 50, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  live: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.ink, borderColor: colors.ink },
  otp: { backgroundColor: colors.warningSoft, borderColor: colors.warningSoft, alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  dotActive: { borderColor: colors.ink },
  pulse: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink },
  line: { width: 2, flex: 1, minHeight: 30, backgroundColor: colors.border, marginTop: 2 },
  cancelledBox: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
