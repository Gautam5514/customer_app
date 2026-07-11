import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { Txt, Row, Loading, EmptyState, Button } from "../../src/components/ui";
import { ActiveTicket, HistoryItem, HistoryMonthHeader } from "../../src/components/BookingCard";
import { inr } from "../../src/lib/format";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useMyBookings } from "../../src/lib/queries";
import { useAuth } from "../../src/store/auth";
import { colors, spacing, font, radii } from "../../src/theme";

const ACTIVE = ["pending", "accepted", "provider_on_way", "in_progress", "disputed"];

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useMyBookings();
  const [tab, setTab] = useState("active");

  const bookings = data?.bookings || [];
  const { active, past } = useMemo(() => {
    const a = [], p = [];
    for (const b of bookings) (ACTIVE.includes(b.status) ? a : p).push(b);
    return { active: a, past: p };
  }, [bookings]);

  const completed = useMemo(() => past.filter((b) => b.status === "completed"), [past]);
  const completedCount = completed.length;
  const totalSpent = useMemo(
    () => completed.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0),
    [completed]
  );

  // History renders as one flat list with month markers woven in, so the
  // timeline groups by month without a SectionList.
  const historyList = useMemo(() => {
    const out = [];
    let lastMonth = null;
    for (const b of past) {
      const month = dayjs(b.scheduledDate).format("MMMM YYYY");
      if (month !== lastMonth) {
        out.push({ __month: month, _id: `month-${month}`, first: out.length === 0 });
        lastMonth = month;
      }
      out.push(b);
    }
    return out;
  }, [past]);

  const list = tab === "active" ? active : historyList;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
      {/* Header — title + live summary + segmented tabs */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt size={font.size.xxl} weight={font.weight.heavy}>My bookings</Txt>
        {user && bookings.length > 0 ? (
          <Row gap={6} style={{ marginTop: 4 }}>
            {active.length > 0 ? (
              <>
                <View style={styles.liveDot} />
                <Txt muted size={font.size.sm}>
                  {active.length} live{completedCount ? ` · ${completedCount} completed` : ""}
                </Txt>
              </>
            ) : (
              <Txt muted size={font.size.sm}>{completedCount} completed so far</Txt>
            )}
          </Row>
        ) : null}

        {user ? (
          <Row style={styles.tabs} gap={0}>
            {[
              ["active", "Active", active.length],
              ["past", "History", past.length],
            ].map(([key, label, count]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
                <Row gap={6}>
                  <Txt weight={font.weight.semibold} size={font.size.sm} color={tab === key ? colors.textOnInk : colors.textMuted}>
                    {label}
                  </Txt>
                  {count > 0 ? (
                    <View style={[styles.countBadge, tab === key && styles.countBadgeActive]}>
                      <Txt size={10} weight={font.weight.bold} color={tab === key ? colors.ink : colors.textMuted}>
                        {count}
                      </Txt>
                    </View>
                  ) : null}
                </Row>
              </Pressable>
            ))}
          </Row>
        ) : null}
      </View>

      {!user ? (
        <SignInPrompt
          icon="receipt-outline"
          title="Track your bookings"
          subtitle="Sign in to see your active jobs, history and live status updates."
        />
      ) : isLoading ? (
        <Loading label="Loading bookings…" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.ink} />}
          ListHeaderComponent={
            tab === "past" && completedCount > 0 ? (
              <View style={styles.statsCard}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Txt color={colors.gold} weight={font.weight.heavy} size={font.size.xxl}>{completedCount}</Txt>
                  <Txt color="rgba(255,255,255,0.65)" size={font.size.xs} style={{ marginTop: 2 }}>
                    {completedCount === 1 ? "service done" : "services done"}
                  </Txt>
                </View>
                <View style={styles.statsDivider} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Txt color={colors.textOnInk} weight={font.weight.heavy} size={font.size.xxl}>{inr(totalSpent)}</Txt>
                  <Txt color="rgba(255,255,255,0.65)" size={font.size.xs} style={{ marginTop: 2 }}>total spent</Txt>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) =>
            tab === "active" ? (
              <ActiveTicket booking={item} onPress={() => router.push(`/booking/${item._id}`)} />
            ) : item.__month ? (
              <HistoryMonthHeader label={item.__month} first={item.first} />
            ) : (
              <HistoryItem
                booking={item}
                isLast={index === list.length - 1 || !!list[index + 1]?.__month}
                onPress={() => router.push(`/booking/${item._id}`)}
                onRate={() => router.push(`/rate/${item._id}`)}
                onRebook={() => router.push(`/category/${item.serviceCategory}`)}
              />
            )
          }
          ListEmptyComponent={
            <EmptyState
              icon={tab === "active" ? "calendar-outline" : "file-tray-outline"}
              title={tab === "active" ? "No active bookings" : "Nothing here yet"}
              subtitle={tab === "active" ? "Book a service and track it live right here." : "Your completed and cancelled jobs will show up here."}
              action={tab === "active" ? <Button title="Browse services" onPress={() => router.push("/(tabs)")} /> : null}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },

  tabs: { marginTop: spacing.lg, backgroundColor: colors.surfaceSunken, borderRadius: radii.md, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.ink },
  countBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  countBadgeActive: { backgroundColor: colors.gold },

  statsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.ink, borderRadius: radii.lg,
    paddingVertical: spacing.lg, marginBottom: spacing.xl,
  },
  statsDivider: { width: 1, height: 34, backgroundColor: "rgba(255,255,255,0.15)" },
});
