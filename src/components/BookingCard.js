import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Txt, Row, Pill } from "./ui";
import { CategoryBadge } from "./CategoryIcon";
import { colors, spacing, font, radii, statusMeta } from "../theme";
import { inr, fmtDate, fmtTimeSlot } from "../lib/format";

export function BookingCard({ booking, onPress }) {
  const meta = statusMeta[booking.status] || { label: booking.status, tone: "neutral" };
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <Row justify="space-between" align="flex-start">
        <Row gap={spacing.md} align="center" style={{ flex: 1 }}>
          <CategoryBadge category={booking.serviceCategory} size={42} iconSize={22} />
          <View style={{ flex: 1 }}>
            <Txt weight={font.weight.semibold} size={font.size.md} numberOfLines={1}>{booking.serviceName}</Txt>
            <Txt faint size={font.size.xs} style={{ marginTop: 2 }}>#{booking.bookingNumber}</Txt>
          </View>
        </Row>
        <Pill label={meta.label} tone={meta.tone} dot />
      </Row>

      <View style={styles.divider} />

      <Row justify="space-between">
        <Row gap={6}>
          <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
          <Txt muted size={font.size.sm}>{fmtDate(booking.scheduledDate)} · {fmtTimeSlot(booking.scheduledTimeSlot)}</Txt>
        </Row>
        <Txt weight={font.weight.bold} size={font.size.md}>{inr(booking.pricing?.totalAmount)}</Txt>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  icon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
