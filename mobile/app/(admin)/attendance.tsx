import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, ScrollView, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  CalendarDays, Search, Clock, LogIn, LogOut,
  UserX, ChevronDown,
} from "lucide-react-native";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: string; // PRESENT | ABSENT | LATE
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    gradeLevel: string | null;
  };
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  PRESENT: { color: "#10B981", label: "Present" },
  ABSENT:  { color: "#EF4444", label: "Absent"  },
  LATE:    { color: "#F59E0B", label: "Late"    },
};

const STATUS_FILTERS = ["ALL", "PRESENT", "LATE", "ABSENT"];

export default function AdminAttendanceScreen() {
  const { token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [records, setRecords]           = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered]         = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [search, setSearch]             = useState("");

  // Summary counts
  const summary = {
    total:   records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late:    records.filter((r) => r.status === "LATE").length,
    absent:  records.filter((r) => r.status === "ABSENT").length,
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get("/attendance/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
      setFiltered(res.data);
    } catch {
      setRecords([]); setFiltered([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAttendance(); }, []);

  // Apply both status filter + search
  const applyFilters = (status: string, query: string) => {
    let result = records;
    if (status !== "ALL") {
      result = result.filter((r) => r.status === status);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.student.firstName.toLowerCase().includes(q) ||
          r.student.lastName.toLowerCase().includes(q) ||
          r.student.username.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  };

  const handleStatusFilter = (status: string) => {
    setActiveStatus(status);
    applyFilters(status, search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(activeStatus, text);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <View style={[s.headerIconBadge, { backgroundColor: C.primary + "22" }]}>
          <CalendarDays size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: C.text }]}>Attendance</Text>
          <Text style={[s.headerSub, { color: C.muted }]}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── Summary Strip ── */}
      <View style={[s.summaryRow, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <SummaryPill label="Total"   value={summary.total}   color={C.primary} C={C} />
        <View style={[s.summaryDivider, { backgroundColor: C.border }]} />
        <SummaryPill label="Present" value={summary.present} color="#10B981" C={C} />
        <View style={[s.summaryDivider, { backgroundColor: C.border }]} />
        <SummaryPill label="Late"    value={summary.late}    color="#F59E0B" C={C} />
        <View style={[s.summaryDivider, { backgroundColor: C.border }]} />
        <SummaryPill label="Absent"  value={summary.absent}  color="#EF4444" C={C} />
      </View>

      {/* ── Search ── */}
      <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
        <Search size={16} color={C.muted} />
        <TextInput
          style={[s.searchInput, { color: C.text }]}
          placeholder="Search student name or username…"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* ── Status Filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={s.filterRow}
      >
        {STATUS_FILTERS.map((status) => {
          const isActive = activeStatus === status;
          const color = STATUS_META[status]?.color ?? C.primary;
          return (
            <TouchableOpacity
              key={status}
              style={[
                s.filterBtn,
                { backgroundColor: C.card, borderColor: C.border },
                isActive && { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
              ]}
              onPress={() => handleStatusFilter(status)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterText, { color: isActive ? "#fff" : C.muted }]}>
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Records List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAttendance(); }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={[s.emptyRing, { borderColor: C.border }]}>
              <CalendarDays size={34} color={C.muted} />
            </View>
            <Text style={[s.emptyTitle, { color: C.text }]}>No records found</Text>
            <Text style={[s.emptySub, { color: C.muted }]}>
              Try adjusting the filter or search
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] ?? STATUS_META.PRESENT;
          const initials = `${item.student.firstName[0]}${item.student.lastName[0]}`;
          return (
            <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Left accent bar */}
              <View style={[s.accentBar, { backgroundColor: meta.color }]} />

              {/* Avatar */}
              <View style={[s.avatar, { backgroundColor: meta.color + "22" }]}>
                <Text style={[s.avatarText, { color: meta.color }]}>{initials}</Text>
              </View>

              {/* Info */}
              <View style={s.cardInfo}>
                <View style={s.cardTopRow}>
                  <Text style={[s.cardName, { color: C.text }]}>
                    {item.student.firstName} {item.student.lastName}
                  </Text>
                  {/* Status badge */}
                  <View style={[s.statusBadge, { backgroundColor: meta.color + "22" }]}>
                    <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <Text style={[s.cardUsername, { color: C.muted }]}>
                  @{item.student.username}
                  {item.student.gradeLevel
                    ? "  ·  " + item.student.gradeLevel.replace(/_/g, " ")
                    : ""}
                </Text>

                {/* Date + Times */}
                <View style={s.cardFooter}>
                  <View style={s.footerItem}>
                    <CalendarDays size={11} color={C.muted} />
                    <Text style={[s.footerText, { color: C.muted }]}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={s.footerItem}>
                    <LogIn size={11} color="#10B981" />
                    <Text style={[s.footerText, { color: C.muted }]}>{formatTime(item.timeIn)}</Text>
                  </View>
                  <View style={s.footerItem}>
                    <LogOut size={11} color={C.primary} />
                    <Text style={[s.footerText, { color: C.muted }]}>{formatTime(item.timeOut)}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ── Summary Pill ─────────────────────────────────────────────────────────────
function SummaryPill({ label, value, color, C }: {
  label: string; value: number; color: string; C: any;
}) {
  return (
    <View style={s.summaryPill}>
      <Text style={[s.summaryValue, { color }]}>{value}</Text>
      <Text style={[s.summaryLabel, { color: C.muted }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerIconBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 20, fontWeight: "700" },
  headerSub:       { fontSize: 12, marginTop: 1 },

  // Summary strip
  summaryRow:      { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, alignItems: "center" },
  summaryPill:     { flex: 1, alignItems: "center", gap: 2 },
  summaryValue:    { fontSize: 20, fontWeight: "800" },
  summaryLabel:    { fontSize: 11, fontWeight: "500" },
  summaryDivider:  { width: 1, height: 28 },

  // Search
  searchBox:   { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  // Filter
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  filterBtn: { paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, height: 34, justifyContent: "center", alignItems: "center" },
  filterText:{ fontSize: 11, fontWeight: "700" },

  // List
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },

  // Card
  card:        { borderRadius: 14, borderWidth: 1, marginBottom: 10, flexDirection: "row", alignItems: "center", overflow: "hidden", paddingVertical: 14, paddingRight: 14, gap: 12 },
  accentBar:   { width: 4, alignSelf: "stretch", borderRadius: 2 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontSize: 14, fontWeight: "800" },
  cardInfo:    { flex: 1, gap: 4 },
  cardTopRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardName:    { fontSize: 14, fontWeight: "700", flex: 1 },
  cardUsername:{ fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText:  { fontSize: 11, fontWeight: "700" },
  cardFooter:  { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 2 },
  footerItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText:  { fontSize: 11 },

  // Empty
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyRing:  { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub:   { fontSize: 13, textAlign: "center", maxWidth: 240 },
});