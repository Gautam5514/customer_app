import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal, TextInput, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Txt, Row, Card, Button, Loading, ErrorState } from "../src/components/ui";
import { api, apiError } from "../src/lib/api";
import { getSocket } from "../src/lib/socket";
import { colors, spacing, font, radii } from "../src/theme";

const CATEGORIES = [
  ["booking_issue", "Booking issue", "calendar-outline"],
  ["payment_issue", "Payment or payout", "wallet-outline"],
  ["provider_complaint", "Professional issue", "person-outline"],
  ["app_bug", "App problem", "bug-outline"],
  ["general", "Something else", "chatbubble-outline"],
];

const STATUS = {
  open: ["Open", "warning"], in_progress: ["Team replied", "success"],
  resolved: ["Resolved", "neutral"], closed: ["Closed", "neutral"],
};

export default function HelpSupport() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try { setTickets((await api.get("/support")).data.tickets || []); }
    catch (e) { setError(apiError(e, "Couldn't load support conversations.")); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const update = () => load(true);
    socket.on("support:message:new", update);
    socket.on("support:ticket:status", update);
    return () => { socket.off("support:message:new", update); socket.off("support:ticket:status", update); };
  }, [load]);

  const refresh = () => { setRefreshing(true); load(true); };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Support" right={<Pressable onPress={() => setCreating(true)} style={styles.newTop}><Ionicons name="add" size={21} color={colors.textOnInk} /></Pressable>} />
      {loading ? <Loading label="Loading conversations…" /> : error && !tickets.length ? <ErrorState title="Couldn't load support" subtitle={error} onRetry={load} /> : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
          contentContainerStyle={styles.content}
          ListHeaderComponent={<SupportHero onNew={() => setCreating(true)} />}
          ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={30} color={colors.gold} /></View><Txt weight={font.weight.bold} size={font.size.lg}>No conversations yet</Txt><Txt muted center style={styles.emptyText}>Need help with a booking, payment or professional? Start a private chat with our support team.</Txt><Button title="Start a conversation" size="md" onPress={() => setCreating(true)} style={{ marginTop: spacing.xl }} /></View>}
          renderItem={({ item }) => <TicketRow ticket={item} onPress={() => router.push(`/support/${item._id}`)} />}
        />
      )}
      <NewTicketModal visible={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); load(true); router.push(`/support/${id}`); }} />
    </View>
  );
}

function SupportHero({ onNew }) {
  return <View><View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="headset" size={23} color={colors.gold} /></View><View style={{ flex: 1 }}><Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>We're here to help</Txt><Txt color="rgba(255,255,255,0.65)" size={font.size.sm}>Message our support team securely</Txt></View><Pressable onPress={onNew} style={styles.heroButton}><Ionicons name="create-outline" size={16} color={colors.ink} /><Txt weight={font.weight.semibold} size={font.size.sm}>New</Txt></Pressable></View><Txt weight={font.weight.bold} style={styles.sectionLabel}>Your conversations</Txt></View>;
}

function TicketRow({ ticket, onPress }) {
  const [label, tone] = STATUS[ticket.status] || [ticket.status, "neutral"];
  const toneColor = tone === "success" ? colors.success : tone === "warning" ? colors.warning : colors.textMuted;
  return <Card onPress={onPress} style={styles.ticket}><Row align="flex-start"><View style={styles.ticketIcon}><Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} /></View><View style={{ flex: 1 }}><Row justify="space-between"><Txt weight={font.weight.semibold} numberOfLines={1} style={{ flex: 1 }}>{ticket.categoryLabel}</Txt>{ticket.unreadByMe ? <View style={styles.unread}><Txt color={colors.textOnInk} size={10} weight={font.weight.bold}>{ticket.unreadByMe}</Txt></View> : null}</Row><Txt muted size={font.size.sm} numberOfLines={1} style={{ marginTop: 3 }}>{ticket.lastMessage?.text || ticket.subject}</Txt><Row gap={6} style={{ marginTop: spacing.sm }}><View style={[styles.statusDot, { backgroundColor: toneColor }]} /><Txt faint size={font.size.xs}>{label} · {ticket.ticketNumber} · {dayjs(ticket.lastMessageAt).format("D MMM")}</Txt></Row></View><Ionicons name="chevron-forward" size={18} color={colors.textFaint} /></Row></Card>;
}

function NewTicketModal({ visible, onClose, onCreated }) {
  const [category, setCategory] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false); const [error, setError] = useState("");
  const close = () => { if (!sending) { setCategory(""); setMessage(""); setError(""); onClose(); } };
  const submit = async () => { if (!category || message.trim().length < 10) { setError("Choose a topic and add at least 10 characters."); return; } setSending(true); setError(""); try { const data = (await api.post("/support", { category, message: message.trim() })).data; onCreated(data.ticket._id); setCategory(""); setMessage(""); } catch (e) { setError(apiError(e, "Couldn't send your request.")); } finally { setSending(false); } };
  return <Modal visible={visible} animationType="slide" onRequestClose={close}><KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScreenHeader title="New support request" onBack={close} /><FlatList data={CATEGORIES} keyExtractor={(x) => x[0]} numColumns={2} contentContainerStyle={styles.form} columnWrapperStyle={{ gap: spacing.sm }} ListHeaderComponent={<View><Txt weight={font.weight.bold} size={font.size.lg}>What can we help with?</Txt><Txt muted size={font.size.sm} style={{ marginTop: 4, marginBottom: spacing.lg }}>Choose the closest topic for a faster reply.</Txt></View>} renderItem={({ item: c }) => <Pressable onPress={() => { setCategory(c[0]); setError(""); }} style={[styles.category, category === c[0] && styles.categoryActive]}><Ionicons name={c[2]} size={20} color={category === c[0] ? colors.gold : colors.textMuted} /><Txt size={font.size.sm} weight={category === c[0] ? font.weight.semibold : font.weight.regular} style={{ flex: 1 }}>{c[1]}</Txt>{category === c[0] ? <Ionicons name="checkmark-circle" size={17} color={colors.success} /> : null}</Pressable>} ListFooterComponent={<View style={{ marginTop: spacing.lg }}><Txt weight={font.weight.semibold} size={font.size.sm} style={{ marginBottom: spacing.sm }}>Tell us what happened</Txt><TextInput value={message} onChangeText={(v) => { setMessage(v.slice(0, 2000)); setError(""); }} placeholder="Describe the issue and what you need help with…" placeholderTextColor={colors.textFaint} multiline style={styles.input} textAlignVertical="top" /><Txt faint size={font.size.xs} style={{ textAlign: "right", marginTop: 4 }}>{message.length}/2000</Txt>{error ? <Txt color={colors.danger} size={font.size.sm} style={{ marginTop: spacing.sm }}>{error}</Txt> : null}<Button title="Send to support" loading={sending} disabled={!category || message.trim().length < 10} onPress={submit} style={{ marginTop: spacing.lg }} /></View>} /></KeyboardAvoidingView></Modal>;
}

const styles = StyleSheet.create({ root:{flex:1,backgroundColor:colors.bg}, content:{padding:spacing.xl,paddingBottom:40,flexGrow:1}, newTop:{width:36,height:36,borderRadius:18,backgroundColor:colors.ink,alignItems:"center",justifyContent:"center"}, hero:{flexDirection:"row",alignItems:"center",gap:spacing.md,backgroundColor:colors.ink,borderRadius:radii.xl,padding:spacing.lg}, heroIcon:{width:42,height:42,borderRadius:radii.md,backgroundColor:"rgba(255,255,255,0.1)",alignItems:"center",justifyContent:"center"}, heroButton:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:colors.gold,paddingHorizontal:spacing.md,paddingVertical:9,borderRadius:radii.pill}, sectionLabel:{marginTop:spacing.xl,marginBottom:spacing.md}, empty:{alignItems:"center",paddingVertical:spacing.xxxl,paddingHorizontal:spacing.xl},emptyIcon:{width:64,height:64,borderRadius:32,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center",marginBottom:spacing.lg},emptyText:{maxWidth:290,lineHeight:20,marginTop:spacing.sm},ticket:{marginBottom:spacing.md},ticketIcon:{width:42,height:42,borderRadius:radii.md,backgroundColor:colors.surfaceAlt,alignItems:"center",justifyContent:"center"},unread:{minWidth:19,height:19,borderRadius:10,backgroundColor:colors.ink,alignItems:"center",justifyContent:"center",paddingHorizontal:5},statusDot:{width:7,height:7,borderRadius:4},form:{padding:spacing.xl,paddingBottom:50},category:{width:"48.5%",minHeight:70,flexDirection:"row",alignItems:"center",gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md,marginBottom:spacing.sm,backgroundColor:colors.surface},categoryActive:{borderColor:colors.gold,backgroundColor:colors.goldSoft},input:{minHeight:130,borderWidth:1,borderColor:colors.borderStrong,borderRadius:radii.md,padding:spacing.md,fontSize:font.size.base,color:colors.text,backgroundColor:colors.surface} });

