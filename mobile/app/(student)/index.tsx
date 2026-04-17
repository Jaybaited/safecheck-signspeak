import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  Clock,
  BookOpen,
  Gamepad2,
  ClipboardList,
  LogIn,
  LogOut,
  CalendarDays,
} from "lucide-react-native";
import { useRouter } from "expo-router";

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

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
};

// ── Day Circles (M T W T F) ──────────────────────────────────────
function DayCircles() {
  const jsDay = new Date().getDay();
  const todayIndex = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : -1;

  return (
    <View style={dayStyles.row}>
      {["M", "T", "W", "T", "F"].map((d, i) => {
        const isToday = i === todayIndex;
        return (
          <View
            key={i}
            style={[
              dayStyles.circle,
              {
                backgroundColor: isToday
                  ? "#fff"
                  : "rgba(255,255,255,0.18)",
              },
            ]}
          >
            <Text
              style={[
                dayStyles.label,
                { color: isToday ? "#8B1A1A" : "rgba(255,255,255,0.75)" },
              ]}
            >
              {d}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const dayStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 9, fontWeight: "700" },
});

// ── Skeleton Box ─────────────────────────────────────────────────
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
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width: w as any,
          height,
          borderRadius,
          backgroundColor: C.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Skeleton Screen ───────────────────────────────────────────────
function DashboardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <View style={{ padding: 20, gap: 12 }}>
        <SkeletonBox height={28} width="60%" />
        <SkeletonBox height={20} width="40%" />
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <SkeletonBox height={160} style={{ flex: 1, borderRadius: 20 }} />
          <SkeletonBox height={160} style={{ flex: 1, borderRadius: 20 }} />
        </View>
        <SkeletonBox height={20} width="40%" style={{ marginTop: 8 }} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox
              key={i}
              height={90}
              style={{ flex: 1, borderRadius: 20 }}
            />
          ))}
        </View>
        <SkeletonBox height={120} style={{ borderRadius: 22, marginTop: 8 }} />
        <SkeletonBox height={20} width="50%" style={{ marginTop: 8 }} />
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} height={56} style={{ borderRadius: 14 }} />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [today, setToday] = useState<AttendanceToday | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [monthlyStreak, setMonthlyStreak] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const all: AttendanceRecord[] = recentRes.data;
      setRecent(all.slice(0, 5));

      // Count present days this month
      const now = new Date();
      const presentThisMonth = all.filter((r) => {
        const d = new Date(r.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          r.timeIn != null
        );
      });
      setMonthlyStreak(presentThisMonth.length);
    } catch {
      setToday(null);
      setRecent([]);
      setMonthlyStreak(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isPresent = today?.timeIn != null;

  if (loading) return <DashboardSkeleton />;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={[s.greeting, { color: C.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[s.name, { color: C.primary }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[s.subGreeting, { color: C.textSecondary }]}>
              Ready to explore FSL today?
            </Text>
          </View>
          <View style={[s.avatar, { backgroundColor: C.primary }]}>
            <Text style={s.avatarText}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
        </View>

        {/* ── Split Hero Cards ── */}
        <View style={s.heroRow}>

          {/* LEFT — Attendance Card */}
          <View
            style={[
              s.heroCard,
              {
                backgroundColor: C.card,
                shadowColor: "#000",
                borderColor: C.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[s.heroCardLabel, { color: C.textSecondary }]}>
              TODAY'S STATUS
            </Text>
            <View style={s.statusRow}>
              <Text style={[s.heroCardTitle, { color: C.text }]}>
                Attendance
              </Text>
              <View
                style={[
                  s.statusBadge,
                  { backgroundColor: isPresent ? "#dcfce7" : "#fee2e2" },
                ]}
              >
                <Text
                  style={[
                    s.statusBadgeText,
                    { color: isPresent ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  {isPresent ? "PRESENT" : "ABSENT"}
                </Text>
              </View>
            </View>

            {/* Time In */}
            <View
              style={[
                s.timeRow,
                { backgroundColor: C.background, borderColor: C.border },
              ]}
            >
              <LogIn size={13} color={C.primary} />
              <Text style={[s.timeLabel, { color: C.text }]}>Time In</Text>
              <Text style={[s.timeVal, { color: C.textSecondary }]}>
                {formatTime(today?.timeIn ?? null)}
              </Text>
            </View>

            {/* Time Out */}
            <View
              style={[
                s.timeRow,
                { backgroundColor: C.background, borderColor: C.border },
              ]}
            >
              <LogOut size={13} color={C.primary} />
              <Text style={[s.timeLabel, { color: C.text }]}>Time Out</Text>
              <Text style={[s.timeVal, { color: C.textSecondary }]}>
                {formatTime(today?.timeOut ?? null)}
              </Text>
            </View>
          </View>

          {/* RIGHT — Monthly Streak Card */}
          <View style={[s.heroCard, s.streakCard]}>
            <View style={s.streakHeader}>
              <CalendarDays size={16} color="#fff" />
              <Text style={s.weekText}>Week {getWeekNumber()}</Text>
            </View>
            <Text style={s.streakLabel}>MONTHLY STREAK</Text>
            <View style={s.streakRow}>
              <Text style={s.streakNumber}>{monthlyStreak}</Text>
              <Text style={s.streakUnit}> Days</Text>
            </View>
            <DayCircles />
          </View>

        </View>

        {/* ── Quick Access ── */}
<View style={s.sectionHeader}>
  <Text style={[s.sectionTitle, { color: C.text }]}>Quick Access</Text>
  <TouchableOpacity>
    <Text style={[s.viewAll, { color: C.primary }]}>View All</Text>
  </TouchableOpacity>
</View>
<View style={s.quickRow}>

  {/* PRACTICE — dark red, colored card */}
  <TouchableOpacity
    style={[s.quickCard, { backgroundColor: "#8B1A1A", overflow: "hidden" }]}
    onPress={() => router.push("/(student)/fsl-detection")}
    activeOpacity={0.85}
  >
    {/* Background illustration */}
    <Image
      source={require("../../assets/images/fsl-detect-card.png")}
      style={s.quickCardBg}
      resizeMode="cover"
    />
    <View style={s.quickCardContent}>
      <BookOpen size={24} color="#fff" />
      <Text style={[s.quickLabel, { color: "#fff" }]}>PRACTICE</Text>
    </View>
  </TouchableOpacity>

  {/* GAMES — white card */}
  <TouchableOpacity
    style={[s.quickCard, { backgroundColor: C.card, overflow: "hidden", borderWidth: 1, borderColor: C.border }]}
    onPress={() => router.push("/(student)/fsl-game")}
    activeOpacity={0.85}
  >
    {/* Background illustration */}
    <Image
      source={require("../../assets/images/fsl-game-card.png")}
      style={s.quickCardBg}
      resizeMode="cover"
    />
    <View style={s.quickCardContent}>
      <Gamepad2 size={24} color={C.primary} />
      <Text style={[s.quickLabel, { color: C.text }]}>GAMES</Text>
    </View>
  </TouchableOpacity>

  {/* QUIZ — white card */}
  <TouchableOpacity
    style={[s.quickCard, { backgroundColor: C.card, overflow: "hidden", borderWidth: 1, borderColor: C.border }]}
    onPress={() => router.push("/(student)/fsl-learn")}
    activeOpacity={0.85}
  >
    {/* Background illustration */}
    <Image
      source={require("../../assets/images/quiz.png")}
      style={s.quickCardBg}
      resizeMode="cover"
    />
    <View style={s.quickCardContent}>
      <ClipboardList size={24} color={C.primary} />
      <Text style={[s.quickLabel, { color: C.text }]}>QUIZ</Text>
    </View>
  </TouchableOpacity>

</View>

        {/* ── FSL Feature Banner ── */}
        <TouchableOpacity
          style={[
            s.featureBanner,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
          onPress={() => router.push("/(student)/fsl-detection")}
          activeOpacity={0.88}
        >
          <View style={s.featureLeft}>
            <Text style={[s.featureLabel, { color: C.muted }]}>
              DAILY LESSON
            </Text>
            <Text style={[s.featureTitle, { color: C.text }]}>
              Learn Sign Language Now!
            </Text>
            <Text style={[s.featureSub, { color: C.textSecondary }]}>
              Practice FSL letters with your camera
            </Text>
            <TouchableOpacity
              style={[s.featureBtn, { backgroundColor: C.primary }]}
              onPress={() => router.push("/(student)/fsl-detection")}
            >
              <Text style={s.featureBtnText}>Resume</Text>
            </TouchableOpacity>
          </View>
          {/* Emoji fallback — replace with <Image> if you have an asset */}
          <Image
  source={require("../../assets/images/fsl-feature.png")}
  style={s.featureImage}
  resizeMode="contain"
/>
        </TouchableOpacity>

        {/* ── Recent Attendance ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.text }]}>
            Recent Attendance
          </Text>
        </View>
        <View style={[s.card, { backgroundColor: C.card }]}>
          {recent.length === 0 ? (
            <Text style={[s.emptyText, { color: C.textSecondary }]}>
              No attendance records yet.
            </Text>
          ) : (
            recent.map((record, index) => (
              <View
                key={record.id}
                style={[
                  s.recordRow,
                  {
                    borderBottomColor: C.border,
                    borderBottomWidth:
                      index < recent.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={s.recordLeft}>
                  <View
                    style={[s.recordDot, { backgroundColor: C.primary }]}
                  />
                  <View>
                    <Text style={[s.recordDate, { color: C.text }]}>
                      {formatDate(record.date)}
                    </Text>
                  </View>
                </View>
                <View style={s.recordTimes}>
                  <View
                    style={[
                      s.recordTimePill,
                      { backgroundColor: C.background },
                    ]}
                  >
                    <Clock size={10} color={C.textSecondary} />
                    <Text
                      style={[s.recordTimeText, { color: C.textSecondary }]}
                    >
                      In: {formatTime(record.timeIn)}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.recordTimePill,
                      { backgroundColor: C.background },
                    ]}
                  >
                    <Clock size={10} color={C.textSecondary} />
                    <Text
                      style={[s.recordTimeText, { color: C.textSecondary }]}
                    >
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

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: { gap: 2, flex: 1 },
  greeting: { fontSize: 20, fontWeight: "700" },
  name: { fontSize: 26, fontWeight: "800" },
  subGreeting: { fontSize: 13, marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Hero Row (two cards side by side)
  heroRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  heroCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroCardLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroCardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: 9, fontWeight: "700" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 7,
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 1,
  },
  timeLabel: { flex: 1, fontSize: 11, fontWeight: "600" },
  timeVal: { fontSize: 11, fontWeight: "700" },

  // Streak Card (right)
  streakCard: {
    backgroundColor: "#8B1A1A",
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 0,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  weekText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  streakLabel: {
    color: "#FECACA",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 2,
  },
  streakNumber: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 40,
  },
  streakUnit: {
    color: "#FECACA",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  viewAll: { fontSize: 13, fontWeight: "600" },

  // Quick Access
quickRow: {
  flexDirection: "row",
  paddingHorizontal: 20,
  gap: 12,
  marginBottom: 20,
},
quickCard: {
  flex: 1,
  borderRadius: 20,
  paddingVertical: 18,
  alignItems: "center",
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
  minHeight: 90,
  position: "relative",   // ← needed for absolute bg image
},
quickCardBg: {
  position: "absolute",
  bottom: 0,
  right: 0,
  width: "70%",
  height: "100%",
  opacity: 0.12,          // ← subtle watermark effect like in the photo
},
quickCardContent: {
  alignItems: "center",
  gap: 8,
  zIndex: 1,              // ← sits above the bg image
},
quickLabel: {
  fontSize: 10,
  fontWeight: "700",
  textAlign: "center",
},

  // Feature Banner
  featureBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  featureLeft: { gap: 4, flex: 1 },
  featureLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  featureTitle: { fontSize: 17, fontWeight: "800" },
  featureSub: { fontSize: 12, lineHeight: 17 },
  featureBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featureBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  featureImage: {
  width: 110,
  height: 110,
  marginLeft: 8,
},

  // Recent Attendance Card
  card: {
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  recordLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  recordDot: { width: 8, height: 8, borderRadius: 4 },
  recordDate: { fontSize: 13, fontWeight: "600" },
  recordTimes: { alignItems: "flex-end", gap: 4 },
  recordTimePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  recordTimeText: { fontSize: 11, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 16 },
});