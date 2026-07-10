import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Txt, Row, Button, Input, Chip } from "../../src/components/ui";
import { useSubmitRating } from "../../src/lib/queries";
import { apiError } from "../../src/lib/api";
import { colors, spacing, font } from "../../src/theme";

// key = enum value stored by the API (ProviderRating.tags), label = what the
// customer sees. Sending raw labels crashes the enum validation server-side.
const TAGS = [
  { key: "punctual",        label: "Punctual"        },
  { key: "professional",    label: "Professional"    },
  { key: "skilled",         label: "Skilled"         },
  { key: "friendly",        label: "Friendly"        },
  { key: "clean_work",      label: "Clean work"      },
  { key: "value_for_money", label: "Value for money" },
];
const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function Rate() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const submit = useSubmitRating();

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [review, setReview] = useState("");
  const [error, setError] = useState(null);

  function toggleTag(t) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  async function send() {
    setError(null);
    if (rating < 1) return setError("Tap a star to rate.");
    try {
      await submit.mutateAsync({ bookingId, rating, review: review.trim(), tags });
      qc.invalidateQueries({ queryKey: ["booking", String(bookingId)] });
      router.back();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Rate your service" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginVertical: spacing.xl }}>
          <Txt size={font.size.xl} weight={font.weight.heavy} center>How was it?</Txt>
          <Txt muted center style={{ marginTop: 6 }}>Your feedback keeps our crew elite.</Txt>

          <Row gap={spacing.sm} style={{ marginTop: spacing.xxl }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                <Ionicons name={n <= rating ? "star" : "star-outline"} size={42} color={n <= rating ? colors.gold : colors.borderStrong} />
              </Pressable>
            ))}
          </Row>
          {rating ? <Txt weight={font.weight.bold} size={font.size.lg} style={{ marginTop: spacing.md }}>{LABELS[rating]}</Txt> : null}
        </View>

        {rating ? (
          <>
            <Txt weight={font.weight.bold} size={font.size.md} style={{ marginBottom: spacing.md }}>What stood out?</Txt>
            <Row gap={spacing.sm} style={{ flexWrap: "wrap", marginBottom: spacing.xl }}>
              {TAGS.map((t) => (
                <Chip key={t.key} label={t.label} selected={tags.includes(t.key)} onPress={() => toggleTag(t.key)} />
              ))}
            </Row>

            <Input label="Add a review (optional)" placeholder="Tell others about your experience…" value={review} onChangeText={setReview} multiline maxLength={500} style={{ minHeight: 90, textAlignVertical: "top" }} />
          </>
        ) : null}

        {error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginBottom: spacing.md }}>{error}</Txt> : null}
        <Button title="Submit rating" onPress={send} loading={submit.isPending} disabled={!rating} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
