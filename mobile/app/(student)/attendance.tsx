import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity,
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
  X, TrendingUp,
} from "lucide-react-native";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

export default function AttendanceScreen() {
  const { user, token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState<AttendanceRecord | null>(null);

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const openSheet = (record: AttendanceRecord) => {
    setSelected(record);
    slideAnim.setValue(600);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setSelected(null));
  };

  const fetchRecords = async () => {
    try {
      const res = await api.get(`/attendance/student/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

  const getDuration = (timeIn: string, timeOut: string | null) => {
    if (!timeOut) return "Ongoing";
    const diff = new Date(timeOut).getTime() - new Date(timeIn).getTime();
    const hrs  = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  const presentCount = records.filter((r) => r.timeIn).length;

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={[s.title, { color: C.text }]}>Attendance History</Text>
        <Text style={[s.subtitle, { color: C.muted }]}>
          {records.length} total records
        </Text>
      </View>

      {/* ── Summary Row ── */}
<View style={s.summaryRow}>
  <View style={[s.summaryCard, { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" }]}>
    <TrendingUp size={18} color="#FECACA" />
    <Text style={[s.summaryVal, { color: "#fff" }]}>{records.length}</Text>
    <Text style={[s.summaryLabel, { color: "#FECACA" }]}>Total</Text>
  </View>

  <View style={[s.summaryCard, { backgroundColor: "#065F46", borderColor: "#065F46" }]}>
    <CheckCircle size={18} color="#6EE7B7" />
    <Text style={[s.summaryVal, { color: "#fff" }]}>{presentCount}</Text>
    <Text style={[s.summaryLabel, { color: "#6EE7B7" }]}>Present</Text>
  </View>

  <View style={[s.summaryCard, { backgroundColor: "#991B1B", borderColor: "#991B1B" }]}>
    <XCircle size={18} color="#FCA5A5" />
    <Text style={[s.summaryVal, { color: "#fff" }]}>{records.length - presentCount}</Text>
    <Text style={[s.summaryLabel, { color: "#FCA5A5" }]}>Absent</Text>
  </View>
</View>

      {/* ── List ── */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchRecords(); }}
            tintColor={C.primary}
          />
        }
        ListEmptyComponent={
          <Text style={[s.emptyText, { color: C.muted }]}>
            No attendance records found.
          </Text>
        }
        renderItem={({ item }) => {
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
                      ? <CheckCircle size={16} color="#10B981" />
                      : <XCircle size={16} color="#EF4444" />}
                    <Text style={[s.cardStatus, { color: present ? "#10B981" : "#EF4444" }]}>
                      {present ? "Present" : "Absent"}
                    </Text>
                  </View>
                  <Text style={[s.cardDate, { color: C.text }]}>
                    {formatShortDate(item.date)}
                  </Text>
                </View>
                <View style={s.cardBottom}>
                  <View style={[s.timePill, { backgroundColor: C.border }]}>
                    <Clock size={11} color={C.primary} />
                    <Text style={[s.timePillText, { color: C.primary }]}>
                      In: {formatTime(item.timeIn)}
                    </Text>
                  </View>
                  <View style={[s.timePill, { backgroundColor: C.inputBg }]}>
                    <Clock size={11} color={C.subtext} />
                    <Text style={[s.timePillText, { color: C.subtext }]}>
                      Out: {formatTime(item.timeOut)}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[s.tapHint, { color: C.muted }]}>›</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Detail Modal ── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        {/* Backdrop */}
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeSheet}
          />
        </Animated.View>

        {/* Sheet */}
        {selected && (
          <View style={s.sheetWrapper} pointerEvents="box-none">
            <Animated.View
              style={[
                s.sheet,
                { backgroundColor: C.card },
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Handle */}
              <View style={[s.sheetHandle, { backgroundColor: C.border }]} />

              {/* Close */}
              <TouchableOpacity
                style={[s.closeBtn, { backgroundColor: C.inputBg }]}
                onPress={closeSheet}
              >
                <X size={18} color={C.muted} />
              </TouchableOpacity>

              {/* Status icon */}
              <View style={[
                s.sheetIconWrap,
                { backgroundColor: selected.timeIn ? "#D1FAE5" : "#FEE2E2" },
              ]}>
                {selected.timeIn
                  ? <CheckCircle size={36} color="#10B981" />
                  : <XCircle size={36} color="#EF4444" />}
              </View>

              <Text style={[s.sheetStatus, {
                color: selected.timeIn ? "#10B981" : "#EF4444",
              }]}>
                {selected.timeIn ? "Present" : "Absent"}
              </Text>

              <Text style={[s.sheetDate, { color: C.text }]}>
                {formatDate(selected.date)}
              </Text>

              {/* Detail rows */}
              <View style={[s.detailBox, { backgroundColor: C.background, borderColor: C.border }]}>
                <View style={[s.detailRow, { borderBottomColor: C.border }]}>
                  <View style={s.detailLeft}>
                    <CalendarDays size={16} color={C.primary} />
                    <Text style={[s.detailLabel, { color: C.subtext }]}>Date</Text>
                  </View>
                  <Text style={[s.detailVal, { color: C.text }]}>
                    {formatShortDate(selected.date)}
                  </Text>
                </View>

                <View style={[s.detailRow, { borderBottomColor: C.border }]}>
                  <View style={s.detailLeft}>
                    <Clock size={16} color="#10B981" />
                    <Text style={[s.detailLabel, { color: C.subtext }]}>Time In</Text>
                  </View>
                  <Text style={[s.detailVal, { color: C.text }]}>
                    {formatTime(selected.timeIn)}
                  </Text>
                </View>

                <View style={[s.detailRow, { borderBottomColor: C.border }]}>
                  <View style={s.detailLeft}>
                    <Clock size={16} color="#EF4444" />
                    <Text style={[s.detailLabel, { color: C.subtext }]}>Time Out</Text>
                  </View>
                  <Text style={[s.detailVal, { color: C.text }]}>
                    {formatTime(selected.timeOut)}
                  </Text>
                </View>

                <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
                  <View style={s.detailLeft}>
                    <TrendingUp size={16} color={C.primary} />
                    <Text style={[s.detailLabel, { color: C.subtext }]}>Duration</Text>
                  </View>
                  <Text style={[s.detailVal, { color: C.text }]}>
                    {getDuration(selected.timeIn, selected.timeOut)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.sheetCloseBtn, { backgroundColor: C.primary }]}
                onPress={closeSheet}
              >
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
  centered:          { flex: 1, alignItems: "center", justifyContent: "center" },

  header:            { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:             { fontSize: 24, fontWeight: "800" },
  subtitle:          { fontSize: 13, marginTop: 2 },

  summaryRow:        { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  summaryCard:       { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: "center", gap: 4 },
  summaryVal:        { fontSize: 20, fontWeight: "800" },
  summaryLabel:      { fontSize: 11, fontWeight: "600" },

  list:              { paddingHorizontal: 20, paddingBottom: 24 },
  emptyText:         { textAlign: "center", marginTop: 40, fontSize: 14 },

  card:              { borderRadius: 18, borderWidth: 1, marginBottom: 10, flexDirection: "row", alignItems: "center", overflow: "hidden" },
 
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
  detailRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  detailLeft:        { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel:       { fontSize: 13 },
  detailVal:         { fontSize: 13, fontWeight: "700" },
  sheetCloseBtn:     { width: "100%", paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  sheetCloseBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});