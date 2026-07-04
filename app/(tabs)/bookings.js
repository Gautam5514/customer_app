import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt, Row, Loading, EmptyState, Button } from "../../src/components/ui";
import { BookingCard } from "../../src/components/BookingCard";
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

  const list = tab === "active" ? active : past;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt size={font.size.xxl} weight={font.weight.heavy}>My bookings</Txt>
        {user ? (
          <Row style={styles.tabs} gap={0}>
            {[["active", `Active${active.length ? ` (${active.length})` : ""}`], ["past", "History"]].map(([key, label]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
                <Txt weight={font.weight.semibold} size={font.size.sm} color={tab === key ? colors.textOnInk : colors.textMuted}>{label}</Txt>
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
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => router.push(`/booking/${item._id}`)} />
          )}
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
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { marginTop: spacing.lg, backgroundColor: colors.surfaceSunken, borderRadius: radii.md, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.ink },
});
