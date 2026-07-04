import React from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Txt, Row, Loading, EmptyState } from "../../src/components/ui";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useNotifications, useMarkAllRead, useMarkRead } from "../../src/lib/queries";
import { useAuth } from "../../src/store/auth";
import { fromNow } from "../../src/lib/format";
import { colors, spacing, font, radii } from "../../src/theme";

const ICON_FOR = {
  booking_created: "checkmark-circle",
  booking_accepted: "person-circle",
  provider_on_way: "navigate-circle",
  job_started: "construct",
  booking_completed: "checkmark-done-circle",
  booking_cancelled: "close-circle",
  new_job_available: "briefcase",
  payment: "card",
};

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  const notifications = data?.notifications || [];
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  function open(n) {
    if (!n.readAt) markOne.mutate(n._id);
    if (n.bookingId) router.push(`/booking/${n.bookingId}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Row justify="space-between">
          <Txt size={font.size.xxl} weight={font.weight.heavy}>Notifications</Txt>
          {user && hasUnread ? (
            <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
              <Txt color={colors.ink} weight={font.weight.semibold} size={font.size.sm}>Mark all read</Txt>
            </Pressable>
          ) : null}
        </Row>
      </View>

      {!user ? (
        <SignInPrompt
          icon="notifications-outline"
          title="Stay in the loop"
          subtitle="Sign in to get booking updates, arrival alerts and offers."
        />
      ) : isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.ink} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const icon = ICON_FOR[item.type] || "notifications";
            return (
              <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.item, !item.readAt && styles.unread, pressed && { opacity: 0.9 }]}>
                <View style={[styles.iconWrap, !item.readAt && { backgroundColor: colors.ink }]}>
                  <Ionicons name={icon} size={20} color={item.readAt ? colors.textMuted : colors.textOnInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Row justify="space-between" align="flex-start">
                    <Txt weight={font.weight.semibold} size={font.size.base} style={{ flex: 1, paddingRight: 8 }}>{item.title}</Txt>
                    <Txt faint size={font.size.xs}>{fromNow(item.createdAt)}</Txt>
                  </Row>
                  <Txt muted size={font.size.sm} style={{ marginTop: 2, lineHeight: 19 }}>{item.message}</Txt>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="You're all caught up" subtitle="Updates about your bookings and offers will appear here." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  item: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, marginBottom: 6 },
  unread: { backgroundColor: colors.surfaceAlt },
  iconWrap: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.surfaceSunken, alignItems: "center", justifyContent: "center" },
});
