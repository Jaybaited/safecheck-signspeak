import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  ClipboardList, BookOpen, Megaphone,
  Users, UserCheck, UserX, Clock, ChevronRight, Radio,
} from "lucide-react-native";

interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

export default function TeacherDashboard() {
  const { user, token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  const router = useRouter();
  const isDark = resolvedTheme === "dark";

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning!";
    if (h < 18) return "Good Afternoon!";
    return "Good Evening!";
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/attendance/today-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, []);

  const quickActions = [
    {
      label: "Mark\nAttendance",
      icon: ClipboardList,
      bgColor: "#C85A17",
      textColor: "#fff",
      iconColor: "#fff",
      onPress: () => router.push("/(teacher)/attendance"),
    },
    {
      label: "FSL\nProgress",
      icon: BookOpen,
      bgColor: isDark ? "#2a2a2a" : "#ffffff",
      textColor: isDark ? "#ffffff" : "#1a1a1a",
      iconColor: "#C85A17",
      onPress: () => router.push("/(teacher)/fsl"),
    },
    {
      label: "Send\nAnnouncement",
      icon: Megaphone,
      bgColor: isDark ? "#2a2a2a" : "#ffffff",
      textColor: isDark ? "#ffffff" : "#1a1a1a",
      iconColor: "#C85A17",
      onPress: () => router.push("/(teacher)/announcements"),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: C.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#C85A17" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: C.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(); }}
            tintColor="#C85A17"
            colors={["#C85A17"]}
          />
        }
      >
        {/* ── Header ── */}
<View style={s.headerRow}>
  <View style={s.flex}>
    <Text style={[s.greeting, { color: C.muted }]}>{getGreeting()},</Text>
    <Text style={[s.headerName, { color: "#8B1A1A" }]}>
      {user?.firstName} {user?.lastName}
    </Text>
    <Text style={[s.headerSub, { color: C.muted }]}>Ready to explore FSL today?</Text>
  </View>
  <View style={[s.avatarCircle, { backgroundColor: "#8B1A1A" }]}>
    <Text style={s.avatarText}>
      {user?.firstName?.[0]}{user?.lastName?.[0]}
    </Text>
  </View>
</View>

        {/* ── Top Row: Attendance Card LEFT + Quick Access RIGHT ── */}
        <View style={s.topRow}>

          {/* Today's Attendance Card */}
<View style={[s.attendanceCard, { backgroundColor: "#8B1A1A" }]}>
  {/* Top: title only */}
<View style={s.attendanceCardHeader}>
  <Text style={s.attendanceTitle}>Today's Attendance</Text>
</View>

  {/* Session label */}
  <Text style={s.sessionText}>Session: Morning Academic Period</Text>

  {/* Big number */}
  <Text style={s.bigNumber}>{stats?.presentToday ?? 0}</Text>
  <Text style={s.bigNumberLabel}>Students Present</Text>

  {/* Bottom stats row */}
  <View style={s.attendanceStatsRow}>
    <View>
      <Text style={s.attendanceStatLabel}>TOTAL</Text>
      <Text style={s.attendanceStatValue}>{stats?.totalStudents ?? 0}</Text>
    </View>
    <View>
      <Text style={s.attendanceStatLabel}>LATE</Text>
      <Text style={s.attendanceStatValue}>{stats?.lateToday ?? 0}</Text>
    </View>
    <View>
      <Text style={s.attendanceStatLabel}>ABSENT</Text>
      <Text style={s.attendanceStatValue}>{stats?.absentToday ?? 0}</Text>
    </View>
  </View>
</View>

          {/* Quick Access Column */}
          <View style={s.quickColumn}>
            <Text style={[s.quickTitle, { color: C.muted }]}>QUICK ACCESS</Text>
            {quickActions.map((item, i) => {
              const Icon = item.icon;
              const isAccent = item.bgColor === "#C85A17";
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.quickBtn,
                    {
                      backgroundColor: item.bgColor,
                      borderWidth: isAccent ? 0 : 1,
                      borderColor: isDark ? "#333" : "#ebebeb",
                      shadowColor: isAccent ? "#C85A17" : "#000",
                      shadowOpacity: isAccent ? 0.3 : 0.06,
                    },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                >
                  <Icon size={17} color={item.iconColor} />
                  <Text style={[s.quickBtnLabel, { color: item.textColor }]}>
                    {item.label}
                  </Text>
                  <ChevronRight size={13} color={isAccent ? "#ffffff99" : "#C85A17"} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Class Overview ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Class Overview</Text>
          <TouchableOpacity onPress={() => router.push("/(teacher)/attendance")}>
            <Text style={s.viewAll}>View All Rosters</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsGrid}>
          {[
            { label: "TOTAL STUDENTS", value: stats?.totalStudents ?? 0, icon: Users,     color: "#C85A17" },
            { label: "PRESENT",        value: stats?.presentToday  ?? 0, icon: UserCheck, color: "#10B981" },
            { label: "LATE",           value: stats?.lateToday     ?? 0, icon: Clock,     color: "#F59E0B" },
            { label: "ABSENT",         value: stats?.absentToday   ?? 0, icon: UserX,     color: "#EF4444" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <View
                key={i}
                style={[
                  s.statCard,
                  {
                    backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                    borderColor: isDark ? "#2a2a2a" : "#f0f0f0",
                  },
                ]}
              >
                <View style={s.statIconRow}>
                  <Icon size={17} color={card.color} />
                  <Text style={[s.statLabel, { color: C.muted }]}>{card.label}</Text>
                </View>
                <Text style={[s.statValue, { color: C.text }]}>{card.value}</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },

  // Header
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 18,
  gap: 12,
},
greeting:    { fontSize: 14, fontWeight: "500" },
headerName:  { fontSize: 22, fontWeight: "800", marginTop: 2, marginBottom: 2 },
headerSub:   { fontSize: 12, fontWeight: "400" },
avatarCircle:{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
avatarText:  { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Top row
  topRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },

  // Attendance card
 attendanceCard: {
  flex: 1.1,
  borderRadius: 18,
  padding: 14,
  minHeight: 215,
},
attendanceCardHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
},
attendanceTitle:     { color: "#fff", fontSize: 13, fontWeight: "700" },

sessionText:         { color: "#ffffff70", fontSize: 10, marginBottom: 10 },
bigNumber:           { color: "#fff", fontSize: 48, fontWeight: "900", lineHeight: 52 },
bigNumberLabel:      { color: "#ffffff70", fontSize: 11, marginTop: 2, marginBottom: 14 },
attendanceStatsRow:  { flexDirection: "row", gap: 14 },
attendanceStatLabel: { color: "#ffffff60", fontSize: 9, fontWeight: "600", letterSpacing: 0.5 },
attendanceStatValue: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 2 },

  // Quick access
  quickColumn: { flex: 1, gap: 8 },
  quickTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  quickBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  quickBtnLabel: { flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 15 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  viewAll: { fontSize: 12, color: "#C85A17", fontWeight: "600" },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },
  statCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statIconRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel:   { fontSize: 10, fontWeight: "600", letterSpacing: 0.5, flex: 1 },
  statValue:   { fontSize: 28, fontWeight: "800" },
});