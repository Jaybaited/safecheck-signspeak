import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
  Modal, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  CheckCircle, XCircle, Clock, CalendarDays,
  X, TrendingUp, AlertTriangle,
} from "lucide-react-native";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

// ── Skeleton Box ───────────────────────────────────────────────────
function SkeletonBox({
  width: w = "100%", height = 16, borderRadius = 8, style,
}: {
  width?: number | string; height?: number; borderRadius?: number; style?: any;
}) {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  return (
    <Animated.View style={[{ width: w as any, height, borderRadius, backgroundColor: C.border, opacity }, style]} />
  );
}

// ── Full Page Skeleton (initial load) ─────────────────────────────
function AttendancePageSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ gap: 8 }}>
          <SkeletonBox width={150} height={26} borderRadius={8} />
          <SkeletonBox width={120} height={13} borderRadius={5} />
        </View>
        <SkeletonBox width={44} height={44} borderRadius={14} />
      </View>

      {/* Stat cards */}
      <View style={[s.statsRow]}>
        {["#8B1A1A", "#065F46", "#B45309", "#991B1B"].map((bg, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: bg, borderColor: bg }]}>
            <SkeletonBox width={18} height={18} borderRadius={9} style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
            <SkeletonBox width={32} height={20} borderRadius={6} style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
            <SkeletonBox width={44} height={11} borderRadius={4} style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
          </View>
        ))}
      </View>

      {/* Records header */}
      <View style={[s.list, { paddingBottom: 0 }]}>
        <View style={[s.recordsHeader]}>
          <SkeletonBox width={80} height={16} borderRadius={6} />
          <SkeletonBox width={90} height={26} borderRadius={999} />
        </View>

        {/* Record cards — 6 rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={[s.card, { backgroundColor: C.card, borderColor: C.border, marginBottom: 10 }]}
          >
            <View style={[{ flex: 1, padding: 14, gap: 10 }]}>
              {/* Top row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <SkeletonBox width={16} height={16} borderRadius={8} />
                  <SkeletonBox width={60} height={13} borderRadius={5} />
                </View>
                <SkeletonBox width={110} height={13} borderRadius={5} />
              </View>
              {/* Bottom pills */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SkeletonBox width={90} height={24} borderRadius={20} />
                <SkeletonBox width={90} height={24} borderRadius={20} />
              </View>
            </View>
            {/* Arrow */}
            <SkeletonBox width={14} height={22} borderRadius={4} style={{ marginRight: 14 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Records Skeleton (child switch loading) ────────────────────────
function RecordsSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <View style={[s.list, { paddingBottom: 0 }]}>
      <View style={s.recordsHeader}>
        <SkeletonBox width={80} height={16} borderRadius={6} />
        <SkeletonBox width={90} height={26} borderRadius={999} />
      </View>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[s.card, { backgroundColor: C.card, borderColor: C.border, marginBottom: 10 }]}
        >
          <View style={{ flex: 1, padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <SkeletonBox width={16} height={16} borderRadius={8} />
                <SkeletonBox width={60} height={13} borderRadius={5} />
              </View>
              <SkeletonBox width={110} height={13} borderRadius={5} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonBox width={90} height={24} borderRadius={20} />
              <SkeletonBox width={90} height={24} borderRadius={20} />
            </View>
          </View>
          <SkeletonBox width={14} height={22} borderRadius={4} style={{ marginRight: 14 }} />
        </View>
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function ParentAttendance() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [children, setChildren]             = useState<Child[]>([]);
  const [selectedChild, setSelectedChild]   = useState<Child | null>(null);
  const [records, setRecords]               = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]               = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [selected, setSelected]             = useState<AttendanceRecord | null>(null);

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchChildren(); }, []);

  const fetchChildren = async () => {
    try {
      const res = await api.get(`/users/my-children/${user?.id}`);
      setChildren(res.data);
      if (res.data.length > 0) {
        setSelectedChild(res.data[0]);
        fetchAttendance(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAttendance = async (childId: string) => {
    setLoadingRecords(true);
    try {
      const res = await api.get(`/attendance/student/${childId}`);
      setRecords(res.data);
    } catch {
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchChildren(); };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    fetchAttendance(child.id);
  };

  // ── Sheet ──
  const openSheet = (record: AttendanceRecord) => {
    setSelected(record);
    slideAnim.setValue(600);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 600, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSelected(null));
  };

  // ── Formatters ──
  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const getDuration = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn)  return "N/A";
    if (!timeOut) return "Ongoing";
    const diff = new Date(timeOut).getTime() - new Date(timeIn).getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getStatus = (record: AttendanceRecord) => {
    if (!record.timeIn) return { label: "Absent", color: "#EF4444" };
    const h = new Date(record.timeIn).getHours();
    const m = new Date(record.timeIn).getMinutes();
    if (h > 8 || (h === 8 && m > 0)) return { label: "Late", color: "#F59E0B" };
    return { label: "Present", color: "#10B981" };
  };

  // ── Stats ──
  const presentCount = records.filter((r) => {
    if (!r.timeIn) return false;
    const h = new Date(r.timeIn).getHours(), m = new Date(r.timeIn).getMinutes();
    return !(h > 8 || (h === 8 && m > 0));
  }).length;
  const lateCount   = records.filter((r) => {
    if (!r.timeIn) return false;
    const h = new Date(r.timeIn).getHours(), m = new Date(r.timeIn).getMinutes();
    return h > 8 || (h === 8 && m > 0);
  }).length;
  const absentCount = records.filter((r) => !r.timeIn).length;

  // ── Full page skeleton ──
  if (loading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <AttendancePageSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: C.text }]}>Attendance</Text>
          <Text style={[s.subtitle, { color: C.muted }]}>
            {selectedChild ? `${selectedChild.firstName}'s records` : "Last 30 days"}
          </Text>
        </View>
        <View style={[s.headerIcon, { backgroundColor: C.primary + "18", borderColor: C.primary + "33" }]}>
          <CalendarDays size={22} color={C.primary} />
        </View>
      </View>

      {/* ── Child Selector ── */}
      {children.length > 1 && (
        <FlatList
          data={children}
          keyExtractor={(c) => c.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = selectedChild?.id === item.id;
            return (
              <TouchableOpacity
                style={[s.childTab, {
                  backgroundColor: isActive ? C.primary : C.card,
                  borderColor: isActive ? C.primary : C.border,
                }]}
                onPress={() => handleSelectChild(item)}
                activeOpacity={0.8}
              >
                <Text style={[s.childTabText, { color: isActive ? "#fff" : C.muted }]}>
                  {item.firstName}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Stat Cards ── */}
      <View style={s.statsRow}>
        {[
          { bg: "#8B1A1A", icon: <TrendingUp size={18} color="#FECACA" />,   val: records.length, label: "Total",   sub: "#FECACA" },
          { bg: "#065F46", icon: <CheckCircle size={18} color="#6EE7B7" />,  val: presentCount,   label: "Present", sub: "#6EE7B7" },
          { bg: "#B45309", icon: <AlertTriangle size={18} color="#FDE68A" />,val: lateCount,      label: "Late",    sub: "#FDE68A" },
          { bg: "#991B1B", icon: <XCircle size={18} color="#FCA5A5" />,      val: absentCount,    label: "Absent",  sub: "#FCA5A5" },
        ].map((card, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: card.bg, borderColor: card.bg }]}>
            {card.icon}
            <Text style={[s.statVal, { color: "#fff" }]}>{card.val}</Text>
            <Text style={[s.statLabel, { color: card.sub }]}>{card.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Records List or Records Skeleton ── */}
      {loadingRecords ? (
        <RecordsSkeleton />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          ListHeaderComponent={
            <View style={s.recordsHeader}>
              <Text style={[s.sectionTitle, { color: C.text }]}>Records</Text>
              <View style={[s.recordsBadge, { backgroundColor: C.primary + "18" }]}>
                <TrendingUp size={12} color={C.primary} />
                <Text style={[s.recordsBadgeText, { color: C.primary }]}>{records.length} entries</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[s.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <CalendarDays size={32} color={C.muted} />
              <Text style={[s.emptyTitle, { color: C.text }]}>No records yet</Text>
              <Text style={[s.emptySub, { color: C.muted }]}>Attendance records will appear here.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const status  = getStatus(item);
            const present = !!item.timeIn;
            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
                onPress={() => openSheet(item)}
                activeOpacity={0.75}
              >
                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={s.cardIconRow}>
                      {present
                        ? <CheckCircle size={16} color={status.color} />
                        : <XCircle    size={16} color={status.color} />}
                      <Text style={[s.cardStatus, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Text style={[s.cardDate, { color: C.text }]}>{formatShortDate(item.date)}</Text>
                  </View>
                  <View style={s.cardBottom}>
                    <View style={[s.timePill, { backgroundColor: C.border }]}>
                      <Clock size={11} color={C.primary} />
                      <Text style={[s.timePillText, { color: C.primary }]}>In: {formatTime(item.timeIn)}</Text>
                    </View>
                    <View style={[s.timePill, { backgroundColor: C.inputBg }]}>
                      <Clock size={11} color={C.subtext} />
                      <Text style={[s.timePillText, { color: C.subtext }]}>Out: {formatTime(item.timeOut)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[s.tapHint, { color: C.muted }]}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Detail Bottom Sheet ── */}
      <Modal visible={!!selected} transparent animationType="none" onRequestClose={closeSheet}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSheet} />
        </Animated.View>

        {selected && (
          <View style={s.sheetWrapper} pointerEvents="box-none">
            <Animated.View style={[s.sheet, { backgroundColor: C.card, transform: [{ translateY: slideAnim }] }]}>
              <View style={[s.sheetHandle, { backgroundColor: C.border }]} />
              <TouchableOpacity style={[s.closeBtn, { backgroundColor: C.inputBg }]} onPress={closeSheet}>
                <X size={18} color={C.muted} />
              </TouchableOpacity>
              <View style={[s.sheetIconWrap, { backgroundColor: selected.timeIn ? "#D1FAE5" : "#FEE2E2" }]}>
                {selected.timeIn
                  ? <CheckCircle size={36} color="#10B981" />
                  : <XCircle    size={36} color="#EF4444" />}
              </View>
              <Text style={[s.sheetStatus, { color: getStatus(selected).color }]}>
                {getStatus(selected).label}
              </Text>
              <Text style={[s.sheetDate, { color: C.text }]}>{formatDate(selected.date)}</Text>
              <View style={[s.detailBox, { backgroundColor: C.background, borderColor: C.border }]}>
                {[
                  { icon: <CalendarDays size={16} color={C.primary} />, label: "Date",     val: formatShortDate(selected.date) },
                  { icon: <Clock size={16} color="#10B981" />,          label: "Time In",  val: formatTime(selected.timeIn) },
                  { icon: <Clock size={16} color="#EF4444" />,          label: "Time Out", val: formatTime(selected.timeOut) },
                  { icon: <TrendingUp size={16} color={C.primary} />,   label: "Duration", val: getDuration(selected.timeIn, selected.timeOut) },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[s.detailRow, { borderBottomColor: C.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
                    <View style={s.detailLeft}>
                      {row.icon}
                      <Text style={[s.detailLabel, { color: C.subtext }]}>{row.label}</Text>
                    </View>
                    <Text style={[s.detailVal, { color: C.text }]}>{row.val}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={[s.sheetCloseBtn, { backgroundColor: C.primary }]} onPress={closeSheet}>
                <Text style={s.sheetCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1 },
  header:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title:             { fontSize: 26, fontWeight: "800" },
  subtitle:          { fontSize: 13, marginTop: 2 },
  headerIcon:        { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  childTab:          { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  childTabText:      { fontSize: 13, fontWeight: "600" },
  statsRow:          { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard:          { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: "center", gap: 4 },
  statVal:           { fontSize: 20, fontWeight: "800" },
  statLabel:         { fontSize: 11, fontWeight: "600" },
  recordsHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:      { fontSize: 16, fontWeight: "700" },
  recordsBadge:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  recordsBadgeText:  { fontSize: 12, fontWeight: "600" },
  list:              { paddingHorizontal: 20, paddingBottom: 24 },
  emptyCard:         { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle:        { fontSize: 15, fontWeight: "700" },
  emptySub:          { fontSize: 13, textAlign: "center" },
  card:              { borderRadius: 18, borderWidth: 1, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  cardBody:          { flex: 1, padding: 14, gap: 8 },
  cardTop:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardIconRow:       { flexDirection: "row", alignItems: "center", gap: 6 },
  cardStatus:        { fontSize: 13, fontWeight: "700" },
  cardDate:          { fontSize: 13, fontWeight: "600" },
  cardBottom:        { flexDirection: "row", gap: 8 },
  timePill:          { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  timePillText:      { fontSize: 11, fontWeight: "600" },
  tapHint:           { fontSize: 22, paddingRight: 14, fontWeight: "300" },
  backdrop:          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  sheetWrapper:      { flex: 1, justifyContent: "flex-end" },
  sheet:             { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetHandle:       { width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  closeBtn:          { position: "absolute", top: 20, right: 20, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sheetIconWrap:     { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  sheetStatus:       { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sheetDate:         { fontSize: 14, marginBottom: 24, fontWeight: "500" },
  detailBox:         { width: "100%", borderRadius: 18, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  detailRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  detailLeft:        { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel:       { fontSize: 13 },
  detailVal:         { fontSize: 13, fontWeight: "700" },
  sheetCloseBtn:     { width: "100%", paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  sheetCloseBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});