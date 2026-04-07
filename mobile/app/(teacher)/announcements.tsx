import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import { Megaphone, Send, Clock, ChevronDown, ChevronUp } from "lucide-react-native";

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  sentTo: string;
}

const TARGETS = ["ALL", "STUDENTS", "PARENTS"];

export default function TeacherAnnouncementsScreen() {
  const { token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [sending, setSending]             = useState(false);
  const [formOpen, setFormOpen]           = useState(true);
  const [title, setTitle]                 = useState("");
  const [message, setMessage]             = useState("");
  const [target, setTarget]               = useState("ALL");

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get("/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(res.data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Required", "Please fill in both title and message.");
      return;
    }
    setSending(true);
    try {
      await api.post(
        "/announcements",
        { title: title.trim(), message: message.trim(), sentTo: target },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Sent!", "Your announcement has been delivered.");
      setTitle(""); setMessage(""); setTarget("ALL");
      fetchAnnouncements();
    } catch {
      Alert.alert("Error", "Failed to send announcement.");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#8B1A1A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <View style={[s.headerIcon, { backgroundColor: "#8B1A1A22" }]}>
            <Megaphone size={18} color="#8B1A1A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: C.text }]}>Announcements</Text>
            <Text style={[s.headerSub, { color: C.muted }]}>
              {announcements.length} sent
            </Text>
          </View>
        </View>

        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.list, announcements.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }}
              tintColor="#8B1A1A"
            />
          }
          ListHeaderComponent={
            /* ── Compose Form ── */
            <View style={[s.composeCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <TouchableOpacity
                style={s.composeToggle}
                onPress={() => setFormOpen((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[s.composeIconBox, { backgroundColor: "#8B1A1A22" }]}>
                  <Send size={16} color="#8B1A1A" />
                </View>
                <Text style={[s.composeToggleText, { color: C.text }]}>New Announcement</Text>
                {formOpen
                  ? <ChevronUp size={18} color={C.muted} />
                  : <ChevronDown size={18} color={C.muted} />
                }
              </TouchableOpacity>

              {formOpen && (
                <View style={[s.composeBody, { borderTopColor: C.border }]}>
                  {/* Target selector */}
                  <Text style={[s.fieldLabel, { color: C.muted }]}>SEND TO</Text>
                  <View style={s.targetRow}>
                    {TARGETS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          s.targetBtn,
                          { backgroundColor: C.background, borderColor: C.border },
                          target === t && { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
                        ]}
                        onPress={() => setTarget(t)}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.targetText, { color: target === t ? "#fff" : C.muted }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Title */}
                  <Text style={[s.fieldLabel, { color: C.muted }]}>TITLE</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    placeholder="Announcement title…"
                    placeholderTextColor={C.muted}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />

                  {/* Message */}
                  <Text style={[s.fieldLabel, { color: C.muted }]}>MESSAGE</Text>
                  <TextInput
                    style={[s.textarea, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    placeholder="Write your message here…"
                    placeholderTextColor={C.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={[s.charCount, { color: C.muted }]}>{message.length}/500</Text>

                  {/* Send button */}
                  <TouchableOpacity
                    style={[s.sendBtn, { opacity: sending ? 0.7 : 1 }]}
                    onPress={handleSend}
                    disabled={sending}
                    activeOpacity={0.85}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Send size={16} color="#fff" />
                          <Text style={s.sendBtnText}>Send Announcement</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyRing, { borderColor: C.border }]}>
                <Megaphone size={34} color={C.muted} />
              </View>
              <Text style={[s.emptyTitle, { color: C.text }]}>No announcements yet</Text>
              <Text style={[s.emptySub, { color: C.muted }]}>
                Send your first announcement above
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.announcCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={[s.announcAccent, { backgroundColor: "#8B1A1A" }]} />
              <View style={s.announcContent}>
                <View style={s.announcTop}>
                  <Text style={[s.announcTitle, { color: C.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={[s.targetPill, { backgroundColor: "#8B1A1A22" }]}>
                    <Text style={[s.targetPillText, { color: "#8B1A1A" }]}>{item.sentTo}</Text>
                  </View>
                </View>
                <Text style={[s.announcMsg, { color: C.muted }]} numberOfLines={2}>
                  {item.message}
                </Text>
                <View style={s.announcFooter}>
                  <Clock size={11} color={C.muted} />
                  <Text style={[s.announcDate, { color: C.muted }]}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerIcon:      { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 20, fontWeight: "700" },
  headerSub:       { fontSize: 12, marginTop: 1 },
  list:            { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 10 },
  composeCard:     { borderRadius: 16, borderWidth: 1, marginBottom: 4, overflow: "hidden" },
  composeToggle:   { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  composeIconBox:  { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  composeToggleText:{ flex: 1, fontSize: 15, fontWeight: "700" },
  composeBody:     { borderTopWidth: 1, padding: 16, gap: 8 },
  fieldLabel:      { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 4 },
  targetRow:       { flexDirection: "row", gap: 8, marginBottom: 4 },
  targetBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  targetText:      { fontSize: 12, fontWeight: "700" },
  input:           { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea:        { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 100 },
  charCount:       { fontSize: 11, textAlign: "right" },
  sendBtn:         { backgroundColor: "#8B1A1A", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  sendBtnText:     { color: "#fff", fontSize: 15, fontWeight: "800" },
  announcCard:     { borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  announcAccent:   { width: 4 },
  announcContent:  { flex: 1, padding: 14, gap: 5 },
  announcTop:      { flexDirection: "row", alignItems: "center", gap: 8 },
  announcTitle:    { flex: 1, fontSize: 14, fontWeight: "700" },
  targetPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  targetPillText:  { fontSize: 10, fontWeight: "700" },
  announcMsg:      { fontSize: 13, lineHeight: 18 },
  announcFooter:   { flexDirection: "row", alignItems: "center", gap: 4 },
  announcDate:     { fontSize: 11 },
  empty:           { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 40 },
  emptyRing:       { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  emptyTitle:      { fontSize: 16, fontWeight: "600" },
  emptySub:        { fontSize: 13, textAlign: "center", maxWidth: 260 },
});