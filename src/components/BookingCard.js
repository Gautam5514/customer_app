import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row, Pill } from "./ui";
import { CategoryBadge } from "./CategoryIcon";
import { colors, spacing, font, radii, shadow, statusMeta } from "../theme";
import { inr, fmtDate, fmtTimeSlot } from "../lib/format";

// ─── Live pulse dot ──────────────────────────────────────────────────────────
// A dot with a soft expanding ring — marks "something is happening right now".
function PulseDot({ color = colors.success, size = 8 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  return (
    <View style={{ width: size * 2.6, height: size * 2.6, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute", width: size, height: size, borderRadius: size / 2,
          backgroundColor: color, opacity, transform: [{ scale }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ─── Status tracker ──────────────────────────────────────────────────────────
// The journey of an active job: Booked → Pro assigned → On the way → Started.
// Reached stages fill ink; the current stage carries a gold pulsing marker.
const STAGES = [
  { key: "pending", label: "Booked" },
  { key: "accepted", label: "Assigned" },
  { key: "provider_on_way", label: "On the way" },
  { key: "in_progress", label: "Started" },
];
const STAGE_INDEX = { pending: 0, accepted: 1, provider_on_way: 2, in_progress: 3 };

function StatusTracker({ status }) {
  const reached = STAGE_INDEX[status] ?? 0;
  return (
    <View style={styles.tracker}>
      <Row gap={0} align="center">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 ? <View style={[styles.trackLine, i <= reached && styles.trackLineDone]} /> : null}
            {i === reached ? (
              <PulseDot color={colors.gold} size={10} />
            ) : (
              <View style={[styles.trackDot, i < reached && styles.trackDotDone]}>
                {i < reached ? <Ionicons name="checkmark" size={9} color={colors.textOnInk} /> : null}
              </View>
            )}
          </React.Fragment>
        ))}
      </Row>
      <Row justify="space-between" style={{ marginTop: 6 }}>
        {STAGES.map((s, i) => (
          <Txt
            key={s.key}
            size={font.size.xs}
            weight={i === reached ? font.weight.bold : font.weight.regular}
            color={i === reached ? colors.text : i < reached ? colors.textMuted : colors.textFaint}
            style={{ width: 64, textAlign: i === 0 ? "left" : i === STAGES.length - 1 ? "right" : "center" }}
          >
            {s.label}
          </Txt>
        ))}
      </Row>
    </View>
  );
}

// ─── Ticket notch divider ────────────────────────────────────────────────────
// Boarding-pass cutouts: two page-coloured half circles + a dashed rule.
function TicketNotch() {
  return (
    <View style={styles.notchRow}>
      <View style={[styles.notch, { left: -10 }]} />
      <View style={styles.dashes}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>
      <View style={[styles.notch, { right: -10 }]} />
    </View>
  );
}

// ─── Active booking — the "live ticket" ──────────────────────────────────────
export function ActiveTicket({ booking, onPress }) {
  const meta = statusMeta[booking.status] || { label: booking.status, tone: "neutral" };
  const providerName = booking.providerId?.userId?.fullName;
  const showOtp =
    booking.completionOtp && ["accepted", "provider_on_way"].includes(booking.status);
  const disputed = booking.status === "disputed";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ticket, pressed && { transform: [{ scale: 0.995 }], opacity: 0.97 }]}>
      {/* Head — what & which */}
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <Row justify="space-between" align="flex-start">
          <Row gap={spacing.md} style={{ flex: 1 }}>
            <CategoryBadge category={booking.serviceCategory} size={44} iconSize={23} />
            <View style={{ flex: 1 }}>
              <Txt weight={font.weight.bold} size={font.size.md} numberOfLines={1}>{booking.serviceName}</Txt>
              <Txt faint size={font.size.xs} style={{ marginTop: 2 }}>#{booking.bookingNumber}</Txt>
            </View>
          </Row>
          <Pill label={meta.label} tone={meta.tone} dot />
        </Row>

        {disputed ? (
          <Row gap={8} style={styles.disputeNote}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Txt color={colors.danger} size={font.size.sm} weight={font.weight.medium} style={{ flex: 1 }}>
              We're looking into this booking — support will reach out shortly.
            </Txt>
          </Row>
        ) : (
          <StatusTracker status={booking.status} />
        )}
      </View>

      <TicketNotch />

      {/* Stub — when, who & how much */}
      <View style={{ padding: spacing.lg, paddingTop: spacing.md }}>
        <Row justify="space-between">
          <Row gap={6}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Txt muted size={font.size.sm}>{fmtDate(booking.scheduledDate)} · {fmtTimeSlot(booking.scheduledTimeSlot)}</Txt>
          </Row>
          <Txt weight={font.weight.heavy} size={font.size.md}>{inr(booking.pricing?.totalAmount)}</Txt>
        </Row>

        <Row justify="space-between" style={{ marginTop: spacing.md }}>
          {booking.status === "pending" ? (
            <Row gap={6} style={{ flex: 1 }}>
              <PulseDot size={7} />
              <Txt muted size={font.size.sm} numberOfLines={1}>Finding a professional near you…</Txt>
            </Row>
          ) : providerName ? (
            <Row gap={6} style={{ flex: 1 }}>
              <Ionicons name="person-circle-outline" size={17} color={colors.textMuted} />
              <Txt size={font.size.sm} weight={font.weight.semibold} numberOfLines={1}>{providerName}</Txt>
            </Row>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {showOtp ? (
            <View style={styles.otpChip}>
              <Ionicons name="key-outline" size={13} color={colors.warning} />
              <Txt color={colors.warning} weight={font.weight.heavy} size={font.size.sm} style={{ letterSpacing: 2 }}>
                {booking.completionOtp}
              </Txt>
            </View>
          ) : (
            <Row gap={2}>
              <Txt color={colors.ink} weight={font.weight.semibold} size={font.size.sm}>Track</Txt>
              <Ionicons name="chevron-forward" size={14} color={colors.ink} />
            </Row>
          )}
        </Row>
      </View>
    </Pressable>
  );
}

// ─── Past booking — timeline entry ───────────────────────────────────────────
// History reads as a vertical service diary: a rail of status nodes (green ✓
// for done, red ✕ for cancelled) connected by a hairline, each with a flat
// card carrying the receipt facts and quick actions (rate / book again).
export function HistoryItem({ booking, onPress, onRate, onRebook, isLast = false }) {
  const completed = booking.status === "completed";
  const canRate = completed && !booking.isRated;

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Timeline rail */}
      <View style={styles.rail}>
        <View style={[styles.railNode, completed ? styles.railNodeDone : styles.railNodeCancelled]}>
          <Ionicons name={completed ? "checkmark" : "close"} size={12} color={completed ? colors.success : colors.danger} />
        </View>
        {!isLast ? <View style={styles.railLine} /> : null}
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.historyCard, pressed && { backgroundColor: colors.surfaceAlt }]}
      >
        <Row justify="space-between" align="flex-start">
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Txt weight={font.weight.bold} size={font.size.base} numberOfLines={1}>{booking.serviceName}</Txt>
            <Txt muted size={font.size.xs} style={{ marginTop: 3 }}>
              {fmtDate(booking.scheduledDate)} · {fmtTimeSlot(booking.scheduledTimeSlot)}
            </Txt>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Txt weight={font.weight.heavy} size={font.size.base}>{inr(booking.pricing?.totalAmount)}</Txt>
            {!completed ? (
              <Txt color={colors.danger} size={font.size.xs} weight={font.weight.semibold} style={{ marginTop: 3 }}>
                Cancelled{booking.cancelledBy === "customer" ? " by you" : ""}
              </Txt>
            ) : booking.isRated ? (
              <Row gap={3} style={{ marginTop: 3 }}>
                <Ionicons name="star" size={11} color={colors.gold} />
                <Txt faint size={font.size.xs} weight={font.weight.semibold}>Rated</Txt>
              </Row>
            ) : null}
          </View>
        </Row>

        {/* Quick actions */}
        {completed ? (
          <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
            {canRate ? (
              <Pressable onPress={onRate} hitSlop={6} style={({ pressed }) => [styles.rateChip, pressed && { opacity: 0.8 }]}>
                <Ionicons name="star" size={12} color={colors.gold} />
                <Txt color={colors.warning} weight={font.weight.bold} size={font.size.xs}>Rate service</Txt>
              </Pressable>
            ) : null}
            <Pressable onPress={onRebook} hitSlop={6} style={({ pressed }) => [styles.rebookChip, pressed && { opacity: 0.8 }]}>
              <Ionicons name="refresh" size={12} color={colors.ink} />
              <Txt color={colors.ink} weight={font.weight.bold} size={font.size.xs}>Book again</Txt>
            </Pressable>
          </Row>
        ) : null}
      </Pressable>
    </View>
  );
}

// Month bucket label — "JULY 2026" — renders between timeline groups.
export function HistoryMonthHeader({ label, first = false }) {
  return (
    <Txt
      faint
      size={font.size.xs}
      weight={font.weight.bold}
      style={{ letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.md, marginTop: first ? 0 : spacing.lg }}
    >
      {label}
    </Txt>
  );
}

// Kept for backwards compatibility — the bookings screen now picks the
// ticket/history variants directly.
export function BookingCard({ booking, onPress }) {
  return <ActiveTicket booking={booking} onPress={onPress} />;
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colors.surface, borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.lg, overflow: "hidden",
    ...shadow.soft,
  },

  tracker: { marginTop: spacing.lg, paddingHorizontal: 2 },
  trackDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
  },
  trackDotDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  trackLine: { flex: 1, height: 2, backgroundColor: colors.border, borderRadius: 1 },
  trackLineDone: { backgroundColor: colors.ink },

  disputeNote: {
    marginTop: spacing.lg, backgroundColor: colors.dangerSoft, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },

  notchRow: { height: 20, justifyContent: "center" },
  notch: {
    position: "absolute", width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  dashes: { flexDirection: "row", justifyContent: "space-evenly", marginHorizontal: spacing.xl, overflow: "hidden" },
  dash: { width: 6, height: 1, backgroundColor: colors.borderStrong },

  otpChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.warningSoft, borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },

  rail: { width: 34, alignItems: "center" },
  railNode: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginTop: 2,
  },
  railNodeDone: { backgroundColor: colors.successSoft, borderColor: "#CBE8D8" },
  railNodeCancelled: { backgroundColor: colors.dangerSoft, borderColor: "#F2D3CD" },
  railLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginVertical: 4 },

  historyCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  rateChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.goldSoft, borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  rebookChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.surface, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: 12, paddingVertical: 6,
  },
});
