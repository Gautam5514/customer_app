import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { CategoryBadge } from "../../src/components/CategoryIcon";
import { Txt, Row, Card, Button, Loading } from "../../src/components/ui";
import { PaymentWebView } from "../../src/components/PaymentWebView";
import { useBooking, useCancelBooking } from "../../src/lib/queries";
import { createPaymentOrder, verifyPayment } from "../../src/lib/payments";
import { apiError } from "../../src/lib/api";
import { getCachedToken } from "../../src/lib/token";
import { API_BASE } from "../../src/lib/config";
import { inr, fmtDate, fmtTimeSlot, initials } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

const FLOW = [
  { key: "pending", label: "Request placed", desc: "Finding a verified pro near you" },
  { key: "accepted", label: "Pro assigned", desc: "A technician accepted your job" },
  { key: "provider_on_way", label: "On the way", desc: "Your pro is heading over" },
  { key: "in_progress", label: "Work in progress", desc: "Service underway" },
  { key: "completed", label: "Completed", desc: "Job done — hope it's perfect!" },
];
const ORDER = FLOW.map((f) => f.key);
const CANCELLABLE = ["pending", "accepted"];

// Status → hero treatment. One glance at the coloured band tells the whole
// story: amber = searching, blue = live, green = done, red = trouble.
const HERO = {
  pending: { icon: "search", title: "Finding a pro near you", sub: "We're notifying verified professionals in your area", fg: colors.warning, soft: colors.warningSoft },
  accepted: { icon: "person-circle", title: "Pro assigned", sub: "Your professional has accepted the job", fg: colors.info, soft: colors.infoSoft },
  provider_on_way: { icon: "navigate", title: "Your pro is on the way", sub: "Sit tight — arriving in your time slot", fg: colors.info, soft: colors.infoSoft },
  in_progress: { icon: "construct", title: "Work in progress", sub: "Your service is underway right now", fg: colors.info, soft: colors.infoSoft },
  completed: { icon: "checkmark-done", title: "Job completed", sub: "Hope everything is perfect — rate your pro below", fg: colors.success, soft: colors.successSoft },
  cancelled: { icon: "close", title: "Booking cancelled", sub: "", fg: colors.danger, soft: colors.dangerSoft },
  disputed: { icon: "alert", title: "Under review", sub: "Our support team is looking into this booking", fg: colors.danger, soft: colors.dangerSoft },
};

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

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const provider = booking.providerId;
  const providerUser = provider?.userId;
  const currentIndex = ORDER.indexOf(booking.status);
  const hero = HERO[booking.status] || HERO.pending;
  const showProgress = currentIndex >= 0;

  // Payment badge — the coloured truth about money on this booking.
  const isPaid = booking.paymentStatus === "paid";
  const payBadge = isPaid
    ? { label: "PAID", fg: colors.success, soft: colors.successSoft, icon: "checkmark-circle" }
    : booking.paymentMethod === "online"
      ? { label: "PAYMENT PENDING", fg: colors.danger, soft: colors.dangerSoft, icon: "time" }
      : { label: "PAY AFTER SERVICE", fg: colors.warning, soft: colors.warningSoft, icon: "cash" };

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
          <Row gap={spacing.sm} style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Txt color={colors.success} weight={font.weight.semibold} size={font.size.sm} style={{ flex: 1 }}>
              {justPaid === "1"
                ? "Payment successful! Your booking is confirmed."
                : "Booking confirmed! We're notifying nearby pros now."}
            </Txt>
          </Row>
        ) : null}

        {/* ── Status hero — coloured band + journey progress ── */}
        <View style={[styles.hero, { backgroundColor: hero.soft }]}>
          <Row gap={spacing.md} align="center">
            <View style={[styles.heroIcon, { backgroundColor: hero.fg }]}>
              <Ionicons name={hero.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.heavy} size={font.size.lg} color={hero.fg}>{hero.title}</Txt>
              <Txt muted size={font.size.sm} style={{ marginTop: 1 }}>
                {isCancelled && booking.cancelReason ? booking.cancelReason : hero.sub}
              </Txt>
            </View>
          </Row>

          {showProgress ? (
            <>
              <Row gap={5} style={{ marginTop: spacing.lg }}>
                {FLOW.map((f, i) => (
                  <View
                    key={f.key}
                    style={[styles.progressSeg, i <= currentIndex && { backgroundColor: hero.fg }]}
                  />
                ))}
              </Row>
              <Txt size={font.size.xs} color={hero.fg} weight={font.weight.bold} style={{ marginTop: 6 }}>
                STEP {currentIndex + 1} OF {FLOW.length}
              </Txt>
            </>
          ) : null}

          {/* Booked service — folded into the hero so the page opens with one card */}
          <Row gap={spacing.md} align="center" style={styles.heroService}>
            <CategoryBadge category={booking.serviceCategory} size={40} iconSize={20} />
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.bold} size={font.size.sm} numberOfLines={1}>{booking.serviceName}</Txt>
              <Txt muted size={font.size.xs} style={{ marginTop: 2 }}>
                {fmtDate(booking.scheduledDate)} · {fmtTimeSlot(booking.scheduledTimeSlot)}
              </Txt>
            </View>
            <Txt faint size={font.size.xs}>#{booking.bookingNumber}</Txt>
          </Row>
        </View>

        {/* ── Pay-now — unpaid online booking (e.g. checkout was dismissed) ── */}
        {needsPayment ? (
          <View style={styles.payDue}>
            <Row justify="space-between" align="center">
              <Row gap={spacing.sm}>
                <View style={styles.payDueIcon}>
                  <Ionicons name="card" size={16} color={colors.gold} />
                </View>
                <Txt color={colors.textOnInk} weight={font.weight.bold}>Payment pending</Txt>
              </Row>
              <Txt color={colors.gold} weight={font.weight.heavy} size={font.size.lg}>{inr(booking.pricing?.totalAmount)}</Txt>
            </Row>
            <Txt color="rgba(255,255,255,0.65)" size={font.size.sm} style={{ marginVertical: spacing.md }}>
              Complete your payment to lock in this booking.
            </Txt>
            <Button
              title={paying ? "Processing…" : `Pay ${inr(booking.pricing?.totalAmount)} securely`}
              onPress={startPayment}
              loading={paying}
              variant="secondary"
            />
            <Row gap={5} justify="center" style={{ marginTop: spacing.sm }}>
              <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.5)" />
              <Txt size={font.size.xs} color="rgba(255,255,255,0.5)">Secured by Razorpay · UPI, cards, netbanking</Txt>
            </Row>
          </View>
        ) : null}

        {payError ? (
          <Row gap={spacing.sm} style={styles.payErr}>
            <Ionicons name="information-circle" size={18} color={colors.danger} />
            <Txt color={colors.danger} size={font.size.sm} style={{ flex: 1 }}>{payError}</Txt>
          </Row>
        ) : null}

        {/* ── Completion OTP — ticket-style PIN, digit by digit ── */}
        {(booking.status === "accepted" || booking.status === "provider_on_way" || booking.status === "in_progress") && booking.completionOtp ? (
          <View style={styles.otpCard}>
            <Row gap={6}>
              <Ionicons name="key" size={13} color={colors.warning} />
              <Txt color={colors.warning} weight={font.weight.bold} size={font.size.xs} style={{ letterSpacing: 1.2 }}>
                SHARE THIS PIN WITH YOUR PRO
              </Txt>
            </Row>
            <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
              {String(booking.completionOtp).split("").map((d, i) => (
                <View key={i} style={styles.otpDigit}>
                  <Txt weight={font.weight.heavy} size={font.size.xxl}>{d}</Txt>
                </View>
              ))}
            </Row>
            <Txt muted size={font.size.xs} center style={{ marginTop: spacing.md }}>
              They'll enter it to start the job. Don't share until they arrive.
            </Txt>
          </View>
        ) : null}

        {/* ── Provider ── */}
        {providerUser ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <Txt faint size={font.size.xs} weight={font.weight.bold} style={{ letterSpacing: 1.2, marginBottom: spacing.md }}>
              YOUR PROFESSIONAL
            </Txt>
            <Row justify="space-between">
              <Row gap={spacing.md} style={{ flex: 1 }}>
                <View style={styles.avatar}>
                  <Txt weight={font.weight.heavy} color={colors.ink}>{initials(providerUser.fullName) || "P"}</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight={font.weight.bold}>{providerUser.fullName}</Txt>
                  <Row gap={4} style={{ marginTop: 2 }}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                    <Txt color={colors.success} size={font.size.xs} weight={font.weight.semibold}>Verified EliteCrew pro</Txt>
                  </Row>
                </View>
              </Row>
              {providerUser.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${providerUser.phone}`)} style={styles.callBtn}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </Row>
          </Card>
        ) : null}

        {/* ── Timeline ── */}
        {!isCancelled ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.lg }}>Booking journey</Txt>
            {FLOW.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <Row key={step.key} align="flex-start" gap={spacing.md}>
                  <View style={{ alignItems: "center" }}>
                    <View style={[styles.dot, done && styles.dotDone, active && { borderColor: hero.fg, backgroundColor: hero.soft }]}>
                      {done ? (
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      ) : active ? (
                        <View style={[styles.dotCore, { backgroundColor: hero.fg }]} />
                      ) : null}
                    </View>
                    {i < FLOW.length - 1 ? (
                      <View style={[styles.line, done && { backgroundColor: colors.success }, active && { backgroundColor: colors.border }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Txt
                      weight={active ? font.weight.bold : font.weight.medium}
                      color={active ? hero.fg : done ? colors.text : colors.textFaint}
                    >
                      {step.label}
                    </Txt>
                    <Txt size={font.size.sm} color={active ? colors.textMuted : colors.textFaint} style={{ marginTop: 1 }}>
                      {step.desc}
                    </Txt>
                  </View>
                </Row>
              );
            })}
          </Card>
        ) : null}

        {/* ── Address ── */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Row gap={spacing.sm} align="flex-start">
            <View style={styles.addrIcon}>
              <Ionicons name="location" size={15} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.bold} size={font.size.sm}>Service address</Txt>
              <Txt muted size={font.size.sm} style={{ lineHeight: 20, marginTop: 3 }}>{booking.address?.text}</Txt>
              <Txt faint size={font.size.xs} style={{ marginTop: 1 }}>
                {booking.address?.city}{booking.address?.pincode ? ` · ${booking.address.pincode}` : ""}
              </Txt>
            </View>
          </Row>
        </Card>

        {/* ── Bill — with the coloured payment badge ── */}
        <Card>
          <Row justify="space-between" style={{ marginBottom: spacing.md }}>
            <Txt weight={font.weight.bold} size={font.size.md}>Bill details</Txt>
            <Row gap={4} style={[styles.payBadge, { backgroundColor: payBadge.soft }]}>
              <Ionicons name={payBadge.icon} size={11} color={payBadge.fg} />
              <Txt size={font.size.xs} weight={font.weight.heavy} color={payBadge.fg} style={{ letterSpacing: 0.5 }}>
                {payBadge.label}
              </Txt>
            </Row>
          </Row>
          <PriceRow label="Service charge" value={inr(booking.pricing?.basePrice)} />
          <PriceRow label="Platform fee" value={inr(booking.pricing?.platformFee)} />
          <PriceRow label="GST" value={inr(booking.pricing?.tax)} />
          {booking.pricing?.discount ? <PriceRow label="Discount" value={`- ${inr(booking.pricing.discount)}`} positive /> : null}
          <View style={styles.divider} />
          <Row justify="space-between">
            <Row gap={5}>
              <Ionicons
                name={booking.paymentMethod === "online" ? "flash" : "cash-outline"}
                size={14}
                color={booking.paymentMethod === "online" ? colors.success : colors.warning}
              />
              <Txt weight={font.weight.bold}>Total · {booking.paymentMethod === "online" ? "Online" : "Cash/UPI"}</Txt>
            </Row>
            <Txt weight={font.weight.heavy} size={font.size.lg}>{inr(booking.pricing?.totalAmount)}</Txt>
          </Row>
        </Card>

        {/* ── Invoice ── */}
        {isCompleted ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
              <View style={styles.invoiceIcon}>
                <Ionicons name="document-text-outline" size={15} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight={font.weight.bold} size={font.size.md}>Invoice</Txt>
                <Txt size={font.size.xs} muted>Tax invoice for this booking</Txt>
              </View>
            </Row>
            {downloadError ? (
              <Txt size={font.size.xs} color={colors.danger} style={{ marginBottom: spacing.sm }}>{downloadError}</Txt>
            ) : null}
            <Button title="Download invoice" variant="secondary" loading={downloading} onPress={onDownloadInvoice} />
          </Card>
        ) : null}

        {/* ── Actions ── */}
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
  successBanner: {
    alignItems: "center", backgroundColor: colors.successSoft,
    borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg,
  },

  hero: { borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg },
  heroIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  progressSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.08)" },
  heroService: {
    marginTop: spacing.lg, backgroundColor: colors.surface,
    borderRadius: radii.md, padding: spacing.md,
  },

  payDue: {
    backgroundColor: colors.ink, borderRadius: radii.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  payDueIcon: {
    width: 30, height: 30, borderRadius: radii.sm, backgroundColor: "rgba(200,164,92,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  payErr: {
    alignItems: "center", backgroundColor: colors.dangerSoft,
    borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg,
  },

  otpCard: {
    alignItems: "center", backgroundColor: colors.warningSoft,
    borderWidth: 1.5, borderColor: colors.gold, borderStyle: "dashed",
    borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  otpDigit: {
    width: 46, height: 54, borderRadius: radii.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },

  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.success,
    alignItems: "center", justifyContent: "center",
  },

  dot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotCore: { width: 9, height: 9, borderRadius: 5 },
  line: { width: 2, flex: 1, minHeight: 30, backgroundColor: colors.border, marginTop: 2 },

  addrIcon: {
    width: 28, height: 28, borderRadius: radii.sm, backgroundColor: colors.infoSoft,
    alignItems: "center", justifyContent: "center",
  },

  payBadge: {
    alignItems: "center", borderRadius: radii.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },

  invoiceIcon: {
    width: 30, height: 30, borderRadius: radii.sm, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
