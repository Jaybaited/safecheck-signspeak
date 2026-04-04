import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  ClipboardList, UserCheck, UserX, Clock,
  CheckCircle, XCircle, AlertCircle, CalendarDays,
} from "lucide-react-native";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  gradeLevel: string | null;
}

interface AttendanceLog {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: string;
  student: { firstName: string; lastName: string; username: string };
}

const STATUS_META: Record<string, { color: string; icon: any; label: string }> = {
  PRESENT: { color: "#10B981", icon: CheckCircle,  label: "Present" },
  ABSENT:  { color: "#EF4444", icon: XCircle,      label: "Absent"  },
  LATE:    { color: "#F59E0B", icon: AlertCircle,  label: "Late"    },
};

const STATUS_CYCLE = ["PRESENT", "LATE", "ABSENT"];

type TabType = "mark" | "logs";

export default function TeacherAttendanceScreen() {
  const { token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [tab, setTab]                   = useState<TabType>("mark");
  const [students, setStudents]         = useState<Student[]>([]);
  const [logs, setLogs]                 = useState<AttendanceLog[]>([]);
  const [marks, setMarks]               = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [saving, setSaving]             = useState(false);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const fetchAll = useCallback(async () => {
    try {
      const [studRes, logRes] = await Promise.all([
        api.get("/users?role=STUDENT", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/attendance/all",     { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStudents(studRes.data);
      setLogs(logRes.data);
      // default all to PRESENT
      const initial: Record<string, string> = {};
      studRes.data.forEach((s: Student) => { initial[s.id] = "PRESENT"; });
      setMarks(initial);
    } catch {
      setStudents([]); setLogs([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, []);

  const cycleStatus = (id: string) => {
    setMarks((prev) => {
      const cur = prev[id] ?? "PRESENT";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      return { ...prev, [id]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(marks).map(([studentId, status]) => ({
        studentId, status,
      }));
      await api.post("/attendance/bulk", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Saved!", "Attendance has been recorded successfully.");
      fetchAll();
    } catch {
      Alert.alert("Error", "Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

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

      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <View style={[s.headerIcon, { backgroundColor: "#8B1A1A22" }]}>
          <ClipboardList size={18} color="#8B1A1A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: C.text }]}>Attendance</Text>
          <Text style={[s.headerSub, { color: C.muted }]}>{today}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        {(["mark", "logs"] as TabType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && { borderBottomColor: "#8B1A1A", borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, { color: tab === t ? "#8B1A1A" : C.muted }]}>
              {t === "mark" ? "Mark Attendance" : "Class Logs"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Mark Attendance Tab ── */}
      {tab === "mark" && (
        <>
          {/* Legend */}
          <View style={[s.legend, { backgroundColor: C.card, borderBottomColor: C.border }]}>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <View key={k} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: v.color }]} />
                <Text style={[s.legendText, { color: C.muted }]}>{v.label}</Text>
              </View>
            ))}
            <Text style={[s.legendHint, { color: C.muted }]}>Tap to cycle</Text>
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[s.list, students.length === 0 && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#8B1A1A" />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <UserX size={36} color={C.muted} />
                <Text style={[s.emptyTitle, { color: C.text }]}>No students found</Text>
              </View>
            }
            ListFooterComponent={
              students.length > 0 ? (
                <TouchableOpacity
                  style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.saveBtnText}>Save Attendance</Text>
                  }
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => {
              const status = marks[item.id] ?? "PRESENT";
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              return (
                <TouchableOpacity
                  style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
                  onPress={() => cycleStatus(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={[s.cardAccent, { backgroundColor: meta.color }]} />
                  <View style={[s.cardAvatar, { backgroundColor: meta.color + "22" }]}>
                    <Text style={[s.cardAvatarText, { color: meta.color }]}>
                      {item.firstName[0]}{item.lastName[0]}
                    </Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={[s.cardName, { color: C.text }]}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[s.cardSub, { color: C.muted }]}>
                      @{item.username}{item.gradeLevel ? "  ·  " + item.gradeLevel.replace(/_/g, " ") : ""}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: meta.color + "22" }]}>
                    <Icon size={14} color={meta.color} />
                    <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* ── Class Logs Tab ── */}
      {tab === "logs" && (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.list, logs.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#8B1A1A" />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <CalendarDays size={36} color={C.muted} />
              <Text style={[s.emptyTitle, { color: C.text }]}>No logs yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.PRESENT;
            return (
              <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={[s.cardAccent, { backgroundColor: meta.color }]} />
                <View style={[s.cardAvatar, { backgroundColor: meta.color + "22" }]}>
                  <Text style={[s.cardAvatarText, { color: meta.color }]}>
                    {item.student.firstName[0]}{item.student.lastName[0]}
                  </Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardName, { color: C.text }]}>
                    {item.student.firstName} {item.student.lastName}
                  </Text>
                  <View style={s.logTimeRow}>
                    <CalendarDays size={11} color={C.muted} />
                    <Text style={[s.cardSub, { color: C.muted }]}>{formatDate(item.date)}</Text>
                    <Text style={[s.cardSub, { color: C.muted }]}>
                      In: {formatTime(item.timeIn)}  ·  Out: {formatTime(item.timeOut)}
                    </Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: meta.color + "22" }]}>
                  <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerIcon:     { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 20, fontWeight: "700" },
  headerSub:      { fontSize: 11, marginTop: 1 },
  tabRow:         { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn:         { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText:        { fontSize: 13, fontWeight: "700" },
  legend:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  legendItem:     { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendText:     { fontSize: 11 },
  legendHint:     { marginLeft: "auto", fontSize: 11, fontStyle: "italic" },
  list:           { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  card:           { borderRadius: 14, borderWidth: 1, marginBottom: 10, flexDirection: "row", alignItems: "center", overflow: "hidden", paddingVertical: 14, paddingRight: 14, gap: 12 },
  cardAccent:     { width: 4, alignSelf: "stretch" },
  cardAvatar:     { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  cardAvatarText: { fontSize: 14, fontWeight: "800" },
  cardInfo:       { flex: 1, gap: 3 },
  cardName:       { fontSize: 14, fontWeight: "700" },
  cardSub:        { fontSize: 11 },
  logTimeRow:     { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  statusBadge:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText:     { fontSize: 11, fontWeight: "700" },
  saveBtn:        { backgroundColor: "#8B1A1A", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 8 },
  saveBtnText:    { color: "#fff", fontSize: 15, fontWeight: "800" },
  empty:          { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyTitle:     { fontSize: 16, fontWeight: "600" },
});