import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Animated,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  GraduationCap, UserCheck, Users, ShieldCheck,
} from "lucide-react-native";

interface UserStats {
  adminCount: number;
  teacherCount: number;
  studentCount: number;
  parentCount: number;
}

// ── Skeleton Box ───────────────────────────────────────────────────
function SkeletonBox({
  width: w = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
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

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[{ width: w as any, height, borderRadius, backgroundColor: C.border, opacity }, style]}
    />
  );
}

// ── Skeleton Screen ────────────────────────────────────────────────
function AdminSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header skeleton */}
      <View style={[s.headerRow, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width={110} height={13} borderRadius={6} />
          <SkeletonBox width={190} height={22} borderRadius={8} />
        </View>
        <SkeletonBox width={46} height={46} borderRadius={23} />
      </View>

      {/* Overview card skeleton */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={[s.overviewCard, { backgroundColor: C.card, gap: 16 }]}>
          <View style={{ flex: 1, gap: 10 }}>
            <SkeletonBox width={120} height={12} borderRadius={6} />
            <SkeletonBox width={70} height={36} borderRadius={8} />
            <SkeletonBox width={150} height={12} borderRadius={6} />
          </View>
          <View style={[s.overviewDivider, { backgroundColor: C.border }]} />
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ alignItems: "flex-end", gap: 4 }}>
                <SkeletonBox width={36} height={18} borderRadius={6} />
                <SkeletonBox width={56} height={11} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick access skeleton */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <SkeletonBox width={120} height={16} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={s.quickRow}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={undefined} height={88} borderRadius={18}
              style={{ flex: 1 }} />
          ))}
        </View>
      </View>

      {/* Stats grid skeleton */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <SkeletonBox width={140} height={16} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={s.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[s.statCard, { backgroundColor: C.card, borderColor: C.border, gap: 10 }]}
            >
              <SkeletonBox width={44} height={44} borderRadius={12} />
              <SkeletonBox width={48} height={28} borderRadius={8} />
              <SkeletonBox width={60} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Info card skeleton */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[s.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <SkeletonBox width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="60%" height={14} borderRadius={6} />
            <SkeletonBox width="100%" height={12} borderRadius={6} />
            <SkeletonBox width="85%" height={12} borderRadius={6} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  const router = useRouter();

  const [stats, setStats]           = useState<UserStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/users/stats", {
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning!";
    if (h < 18) return "Good Afternoon!";
    return "Good Evening!";
  };

  const quickActions = [
    { label: "Manage\nStudents", icon: GraduationCap, color: "#8B1A1A", onPress: () => router.push("/(admin)/students") },
    { label: "Manage\nTeachers", icon: UserCheck,     color: "#B45309", onPress: () => router.push("/(admin)/teachers") },
    { label: "Manage\nParents",  icon: Users,         color: "#8B1A1A", onPress: () => router.push("/(admin)/parents")  },
  ];

  // ── Skeleton while loading ──
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <AdminSkeleton />
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
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={[s.headerRow, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }]}>
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

        {/* ── Overview Card ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={[s.overviewCard, { backgroundColor: "#8B1A1A" }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.overviewLabel}>System Overview</Text>
              <Text style={s.overviewValue}>
                {(stats?.studentCount ?? 0) + (stats?.teacherCount ?? 0) +
                  (stats?.parentCount ?? 0) + (stats?.adminCount ?? 0)}
              </Text>
              <Text style={s.overviewSub}>Total registered users</Text>
            </View>
            <View style={s.overviewDivider} />
            <View style={s.overviewRight}>
              <View style={s.overviewStatRow}>
                <Text style={s.overviewStatVal}>{stats?.studentCount ?? 0}</Text>
                <Text style={s.overviewStatLabel}>Students</Text>
              </View>
              <View style={s.overviewStatRow}>
                <Text style={s.overviewStatVal}>{stats?.teacherCount ?? 0}</Text>
                <Text style={s.overviewStatLabel}>Teachers</Text>
              </View>
              <View style={s.overviewStatRow}>
                <Text style={s.overviewStatVal}>{stats?.parentCount ?? 0}</Text>
                <Text style={s.overviewStatLabel}>Parents</Text>
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
                  <Icon size={28} color="#fff" />
                  <Text style={s.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Stats Grid ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={[s.sectionTitle, { color: C.text }]}>User Breakdown</Text>
          <View style={s.statsGrid}>
            {[
              { label: "Students", value: stats?.studentCount ?? 0, icon: GraduationCap, color: C.primary },
              { label: "Teachers", value: stats?.teacherCount ?? 0, icon: UserCheck,     color: "#10B981" },
              { label: "Parents",  value: stats?.parentCount  ?? 0, icon: Users,         color: "#F59E0B" },
              { label: "Admins",   value: stats?.adminCount   ?? 0, icon: ShieldCheck,   color: "#EF4444" },
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

        {/* ── Info Card ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[s.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[s.infoIconBox, { backgroundColor: C.primary + "22" }]}>
              <ShieldCheck size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoTitle, { color: C.text }]}>SafeCheck – SignSpeak</Text>
              <Text style={[s.infoSub, { color: C.muted }]}>
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
  headerRow:         { flexDirection: "row", alignItems: "center" },
  greeting:          { fontSize: 13, fontWeight: "500" },
  name:              { fontSize: 22, fontWeight: "800", marginTop: 2 },
  avatarCircle:      { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:        { color: "#fff", fontSize: 16, fontWeight: "800" },
  overviewCard:      { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  overviewLabel:     { color: "#ffffff99", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  overviewValue:     { color: "#fff", fontSize: 36, fontWeight: "800", lineHeight: 40 },
  overviewSub:       { color: "#ffffff99", fontSize: 12, marginTop: 2 },
  overviewDivider:   { width: 1, height: "100%", backgroundColor: "#ffffff30" },
  overviewRight:     { gap: 8 },
  overviewStatRow:   { alignItems: "flex-end" },
  overviewStatVal:   { color: "#fff", fontSize: 18, fontWeight: "800" },
  overviewStatLabel: { color: "#ffffff99", fontSize: 11 },
  sectionTitle:      { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  quickRow:          { flexDirection: "row", gap: 10 },
  quickCard:         { flex: 1, borderRadius: 18, paddingVertical: 20, alignItems: "center", justifyContent: "center", gap: 10 },
  quickLabel:        { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },
  statsGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:          { width: "47.5%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  statIconBox:       { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue:         { fontSize: 28, fontWeight: "800" },
  statLabel:         { fontSize: 12, fontWeight: "500" },
  infoCard:          { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIconBox:       { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoTitle:         { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoSub:           { fontSize: 12, lineHeight: 18 },
});