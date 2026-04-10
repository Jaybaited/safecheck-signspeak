import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Animated,
  RefreshControl, TouchableOpacity, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  Clock, CheckCircle, XCircle,
  BookOpen, Gamepad2, ClipboardList, ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "react-native";

const { width } = Dimensions.get("window");

interface AttendanceToday {
  timeIn: string | null;
  timeOut: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

// ── Skeleton Box Component ─────────────────────────────────────────
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
function DashboardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header skeleton */}
      <View style={[s.header, { marginBottom: 8 }]}>
        <View style={{ gap: 8 }}>
          <SkeletonBox width={100} height={13} borderRadius={6} />
          <SkeletonBox width={180} height={22} borderRadius={8} />
        </View>
        <SkeletonBox width={46} height={46} borderRadius={23} />
      </View>

      {/* Hero banner skeleton */}
      <View style={[s.heroBanner, { backgroundColor: C.card }]}>
        <View style={{ gap: 10, flex: 1 }}>
          <SkeletonBox width={120} height={12} borderRadius={6} />
          <SkeletonBox width={80} height={22} borderRadius={8} />
          <SkeletonBox width={160} height={11} borderRadius={6} />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox width={24} height={10} borderRadius={4} />
            <SkeletonBox width={50} height={18} borderRadius={6} />
          </View>
          <View style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox width={24} height={10} borderRadius={4} />
            <SkeletonBox width={50} height={18} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Quick actions skeleton */}
      <SkeletonBox width={120} height={16} borderRadius={6} style={{ marginHorizontal: 20, marginBottom: 12 }} />
      <View style={s.quickRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}>
            <SkeletonBox width="100%" height={90} borderRadius={20} />
          </View>
        ))}
      </View>

      {/* Feature banner skeleton */}
      <View style={[s.featureBanner, { borderColor: C.border, marginBottom: 24 }]}>
        <View style={{ gap: 8, flex: 1 }}>
          <SkeletonBox width="60%" height={18} borderRadius={8} />
          <SkeletonBox width="90%" height={12} borderRadius={6} />
          <SkeletonBox width="80%" height={12} borderRadius={6} />
          <SkeletonBox width={90} height={34} borderRadius={20} style={{ marginTop: 4 }} />
        </View>
        <SkeletonBox width={100} height={100} borderRadius={12} style={{ marginLeft: 8 }} />
      </View>

      {/* Recent attendance skeleton */}
      <SkeletonBox width={160} height={16} borderRadius={6} style={{ marginHorizontal: 20, marginBottom: 12 }} />
      <View style={[s.card, { backgroundColor: C.card, gap: 0 }]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              s.recordRow,
              { borderBottomColor: C.border },
              i === 5 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SkeletonBox width={8} height={8} borderRadius={4} />
              <SkeletonBox width={110} height={13} borderRadius={6} />
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <SkeletonBox width={90} height={22} borderRadius={20} />
              <SkeletonBox width={90} height={22} borderRadius={20} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [today, setToday]           = useState<AttendanceToday | null>(null);
  const [recent, setRecent]         = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [todayRes, recentRes] = await Promise.all([
        api.get(`/attendance/student/${user?.id}/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/attendance/student/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setToday(todayRes.data);
      setRecent(recentRes.data.slice(0, 5));
    } catch {
      setToday(null);
      setRecent([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
    });

  const isPresent = today?.timeIn != null;

  // ── Show skeleton while loading ──
  if (loading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={[s.greeting, { color: C.subtext }]}>{getGreeting()}! 👋</Text>
            <Text style={[s.name, { color: C.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View style={[s.avatar, { backgroundColor: C.primary }]}>
            <Text style={s.avatarText}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
        </View>

        {/* ── Hero Attendance Banner ── */}
        <View style={s.heroBanner}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>Today's Attendance</Text>
            <View style={s.heroStatusRow}>
              {isPresent
                ? <CheckCircle size={20} color="#fff" />
                : <XCircle size={20} color="#FECACA" />}
              <Text style={s.heroStatus}>{isPresent ? "Present" : "Absent"}</Text>
            </View>
            <Text style={s.heroSub}>
              {new Date().toLocaleDateString("en-PH", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </Text>
          </View>
          <View style={s.heroRight}>
            <View style={s.heroTimeBox}>
              <Text style={s.heroTimeLabel}>IN</Text>
              <Text style={s.heroTimeVal}>{formatTime(today?.timeIn ?? null)}</Text>
            </View>
            <View style={s.heroTimeDivider} />
            <View style={s.heroTimeBox}>
              <Text style={s.heroTimeLabel}>OUT</Text>
              <Text style={s.heroTimeVal}>{formatTime(today?.timeOut ?? null)}</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={[s.sectionTitle, { color: C.text }]}>Quick Access</Text>
        <View style={s.quickRow}>
          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: "#8B1A1A" }]}
            onPress={() => router.push("/(student)/fsl-detection")}
            activeOpacity={0.85}
          >
            <BookOpen size={28} color="#fff" />
            <Text style={s.quickLabel}>FSL{"\n"}Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: "#B45309" }]}
            onPress={() => router.push("/(student)/fsl-game")}
            activeOpacity={0.85}
          >
            <Gamepad2 size={28} color="#fff" />
            <Text style={s.quickLabel}>FSL{"\n"}Games</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: "#7A1A1A" }]}
            onPress={() => router.push("/(student)/fsl-learn")}
            activeOpacity={0.85}
          >
            <ClipboardList size={28} color="#fff" />
            <Text style={s.quickLabel}>FSL{"\n"}Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* ── FSL Feature Banner ── */}
        <TouchableOpacity
          style={[s.featureBanner, {
            backgroundColor: resolvedTheme === "dark" ? "#2D1A0A" : "#FFF0E6",
            borderColor: resolvedTheme === "dark" ? "#4A2A0A" : "#F5C6A0",
          }]}
          onPress={() => router.push("/(student)/fsl-detection")}
          activeOpacity={0.88}
        >
          <View style={s.featureLeft}>
            <Text style={[s.featureTitle, {
              color: resolvedTheme === "dark" ? "#FECACA" : "#7A2E0E",
            }]}>
              Sign Language
            </Text>
            <Text style={[s.featureSub, {
              color: resolvedTheme === "dark" ? "#C4A0A0" : "#92400E",
            }]}>
              Practice FSL letters with your camera
            </Text>
            <View style={[s.featureBtn, { backgroundColor: C.primary }]}>
              <Text style={s.featureBtnText}>Start Now</Text>
            </View>
          </View>
          <Image
            source={require("../../assets/images/fsl-feature.png")}
            style={s.featureImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* ── Recent Attendance ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Recent Attendance</Text>
          <ChevronRight size={18} color={C.primary} />
        </View>

        <View style={[s.card, { backgroundColor: C.card, shadowColor: C.primary }]}>
          {recent.length === 0 ? (
            <Text style={[s.emptyText, { color: C.muted }]}>
              No attendance records yet.
            </Text>
          ) : (
            recent.map((record, index) => (
              <View
                key={record.id}
                style={[
                  s.recordRow,
                  { borderBottomColor: C.border },
                  index === recent.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={s.recordLeft}>
                  <View style={[s.recordDot, { backgroundColor: C.primary }]} />
                  <Text style={[s.recordDate, { color: C.text }]}>
                    {formatDate(record.date)}
                  </Text>
                </View>
                <View style={s.recordTimes}>
                  <View style={[s.recordTimePill, { backgroundColor: C.border }]}>
                    <Clock size={11} color={C.primary} />
                    <Text style={[s.recordTimeText, { color: C.primary }]}>
                      In: {formatTime(record.timeIn)}
                    </Text>
                  </View>
                  <View style={[s.recordTimePill, { backgroundColor: C.inputBg }]}>
                    <Clock size={11} color={C.subtext} />
                    <Text style={[s.recordTimeText, { color: C.subtext }]}>
                      Out: {formatTime(record.timeOut)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1 },
  centered:        { flex: 1, alignItems: "center", justifyContent: "center" },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerLeft:      { gap: 2 },
  greeting:        { fontSize: 13 },
  name:            { fontSize: 22, fontWeight: "800" },
  avatar:          { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:      { color: "#fff", fontWeight: "800", fontSize: 16 },
  heroBanner:      {
    marginHorizontal: 20, marginTop: 12, marginBottom: 20,
    backgroundColor: "#8B1A1A", borderRadius: 24, padding: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: "#8B1A1A", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  heroLeft:        { gap: 6, flex: 1 },
  heroLabel:       { color: "#FECACA", fontSize: 12, fontWeight: "600" },
  heroStatusRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  heroStatus:      { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSub:         { color: "#FECACA", fontSize: 11 },
  heroRight:       { flexDirection: "row", alignItems: "center", gap: 8 },
  heroTimeBox:     { alignItems: "center", gap: 4 },
  heroTimeLabel:   { color: "#FECACA", fontSize: 10, fontWeight: "700" },
  heroTimeVal:     { color: "#fff", fontSize: 15, fontWeight: "800" },
  heroTimeDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },
  sectionTitle:    { fontSize: 16, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },
  sectionHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  quickRow:        { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  quickCard:       { flex: 1, borderRadius: 20, paddingVertical: 18, alignItems: "center", gap: 10, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  quickLabel:      { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 17 },
  featureBanner:   { marginHorizontal: 20, marginBottom: 24, borderRadius: 22, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5 },
  featureLeft:     { gap: 6, flex: 1 },
  featureTitle:    { fontSize: 18, fontWeight: "800" },
  featureSub:      { fontSize: 12, lineHeight: 18 },
  featureBtn:      { marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  featureBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  featureImage:    { width: 100, height: 100, marginLeft: 8 },
  card:            { borderRadius: 20, marginHorizontal: 20, padding: 16, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  recordRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  recordLeft:      { flexDirection: "row", alignItems: "center", gap: 10 },
  recordDot:       { width: 8, height: 8, borderRadius: 4 },
  recordDate:      { fontSize: 13, fontWeight: "600" },
  recordTimes:     { alignItems: "flex-end", gap: 4 },
  recordTimePill:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  recordTimeText:  { fontSize: 11, fontWeight: "600" },
  emptyText:       { fontSize: 13, textAlign: "center", paddingVertical: 16 },
});