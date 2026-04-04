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
  Users, UserCheck, UserX, Clock,
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

  const [stats, setStats]           = useState<TeacherStats | null>(null);
  const [loading, setLoading]       = useState(true);
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
      color: "#8B1A1A",
      onPress: () => router.push("/(teacher)/attendance"),
    },
    {
      label: "FSL\nProgress",
      icon: BookOpen,
      color: "#B45309",
      onPress: () => router.push("/(teacher)/fsl"),
    },
    {
      label: "Send\nAnnouncement",
      icon: Megaphone,
      color: "#8B1A1A",
      onPress: () => router.push("/(teacher)/announcements"),
    },
  ];

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(); }}
            tintColor="#8B1A1A"
            colors={["#8B1A1A"]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.greeting, { color: C.muted }]}>{getGreeting()} 👋</Text>
            <Text style={[s.name, { color: C.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View style={[s.avatarCircle, { backgroundColor: "#8B1A1A" }]}>
            <Text style={s.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
        </View>

        {/* ── Today's Summary Card ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={[s.summaryCard, { backgroundColor: "#8B1A1A" }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryCardLabel}>Today's Attendance</Text>
              <Text style={s.summaryCardValue}>{stats?.presentToday ?? 0}</Text>
              <Text style={s.summaryCardSub}>students present</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRight}>
              <View style={s.summaryStatRow}>
                <Text style={s.summaryStatVal}>{stats?.totalStudents ?? 0}</Text>
                <Text style={s.summaryStatLabel}>Total</Text>
              </View>
              <View style={s.summaryStatRow}>
                <Text style={s.summaryStatVal}>{stats?.lateToday ?? 0}</Text>
                <Text style={s.summaryStatLabel}>Late</Text>
              </View>
              <View style={s.summaryStatRow}>
                <Text style={s.summaryStatVal}>{stats?.absentToday ?? 0}</Text>
                <Text style={s.summaryStatLabel}>Absent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Access ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Quick Access</Text>
          <View style={s.quickRow}>
            {quickActions.map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.quickCard, { backgroundColor: item.color }]}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                >
                  <Icon size={26} color="#fff" />
                  <Text style={s.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Stat Cards ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Class Overview</Text>
          <View style={s.statsGrid}>
            {[
              { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users,     color: C.primary  },
              { label: "Present",        value: stats?.presentToday  ?? 0, icon: UserCheck,  color: "#10B981"  },
              { label: "Late",           value: stats?.lateToday     ?? 0, icon: Clock,      color: "#F59E0B"  },
              { label: "Absent",         value: stats?.absentToday   ?? 0, icon: UserX,      color: "#EF4444"  },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <View
                  key={i}
                  style={[s.statCard, { backgroundColor: C.card, borderColor: C.border }]}
                >
                  <View style={[s.statIconBox, { backgroundColor: card.color + "22" }]}>
                    <Icon size={20} color={card.color} />
                  </View>
                  <Text style={[s.statValue, { color: C.text }]}>{card.value}</Text>
                  <Text style={[s.statLabel, { color: C.muted }]}>{card.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── About Card ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[s.aboutCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[s.aboutIconBox, { backgroundColor: "#8B1A1A22" }]}>
              <ClipboardList size={20} color="#8B1A1A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.aboutTitle, { color: C.text }]}>SafeCheck – SignSpeak</Text>
              <Text style={[s.aboutSub, { color: C.muted }]}>
                RFID-Based Attendance & FSL Recognition System for Philippine School for the Deaf
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  headerRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 12 },
  greeting:    { fontSize: 13, fontWeight: "500" },
  name:        { fontSize: 22, fontWeight: "800", marginTop: 2 },
  avatarCircle:{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:  { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Summary card
  summaryCard:     { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  summaryCardLabel:{ color: "#ffffff99", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  summaryCardValue:{ color: "#fff", fontSize: 36, fontWeight: "800", lineHeight: 40 },
  summaryCardSub:  { color: "#ffffff99", fontSize: 12, marginTop: 2 },
  summaryDivider:  { width: 1, height: "100%", backgroundColor: "#ffffff30" },
  summaryRight:    { gap: 8 },
  summaryStatRow:  { alignItems: "flex-end" },
  summaryStatVal:  { color: "#fff", fontSize: 18, fontWeight: "800" },
  summaryStatLabel:{ color: "#ffffff99", fontSize: 11 },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  // Quick access
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard:{ flex: 1, borderRadius: 18, paddingVertical: 20, alignItems: "center", justifyContent: "center", gap: 10 },
  quickLabel:{ color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },

  // Stats grid
  statsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:    { width: "47.5%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue:   { fontSize: 28, fontWeight: "800" },
  statLabel:   { fontSize: 12, fontWeight: "500", textAlign: "center" },

  // About card
  aboutCard:   { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  aboutIconBox:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aboutTitle:  { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  aboutSub:    { fontSize: 12, lineHeight: 18 },
});