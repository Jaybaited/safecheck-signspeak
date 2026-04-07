import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 40;

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  photoUrl: string | null;
}

interface TodayAttendance {
  timeIn: string | null;
  timeOut: string | null;
}

const BANNERS = [
  {
    id: "1",
    tag: "SafeCheck",
    title: "Always Know\nWhere They Are",
    sub: "Real-time attendance tracking keeps you informed every school day.",
    bg: "#8B1A1A",
    tagBg: "rgba(255,255,255,0.2)",
    image: require("../../assets/images/banner-safety.png"),
  },
  {
    id: "2",
    tag: "Child Safety",
    title: "Your Child's\nSafety First",
    sub: "Get notified the moment your child arrives or leaves school.",
    bg: "#1A3A8B",
    tagBg: "rgba(255,255,255,0.2)",
    image: require("../../assets/images/banner-child.png"),
  },
  {
    id: "3",
    tag: "Sign Language",
    title: "Learning FSL\nMade Fun",
    sub: "Your child learns Filipino Sign Language through interactive practice.",
    bg: "#1A6B3A",
    tagBg: "rgba(255,255,255,0.2)",
    image: require("../../assets/images/banner-fsl.png"),
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

export default function ParentHome() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [children, setChildren]     = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<Record<string, TodayAttendance>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  const scrollRef   = useRef<ScrollView>(null);
  const bannerIndex = useRef(0);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      const next = (bannerIndex.current + 1) % BANNERS.length;
      bannerIndex.current = next;
      setActiveBanner(next);
      scrollRef.current?.scrollTo({
        x: next * (BANNER_WIDTH + 20),
        animated: true,
      });
    }, 3500);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/users/my-children/${user?.id}`);
      setChildren(res.data);
      const map: Record<string, TodayAttendance> = {};
      await Promise.all(
        res.data.map(async (child: Child) => {
          try {
            const r = await api.get(`/attendance/student/${child.id}/today`);
            map[child.id] = r.data;
          } catch {
            map[child.id] = { timeIn: null, timeOut: null };
          }
        })
      );
      setAttendance(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const getStatus = (att: TodayAttendance | undefined) => {
    if (!att?.timeIn)  return { label: "Absent",    color: "#EF4444" };
    if (!att?.timeOut) return { label: "In School", color: "#10B981" };
    return               { label: "Went Home", color: C.primary };
  };

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const presentCount = children.filter((c) => attendance[c.id]?.timeIn).length;

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

        {/* ── Auto-Rotating Banner ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={BANNER_WIDTH + 20}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 20)
            );
            bannerIndex.current = idx;
            setActiveBanner(idx);
          }}
        >
          {BANNERS.map((item) => (
            <View
              key={item.id}
              style={[s.banner, {
                backgroundColor: item.bg,
                width: BANNER_WIDTH,
                shadowColor: item.bg,
              }]}
            >
              <View style={s.bannerLeft}>
                <View style={[s.bannerTag, { backgroundColor: item.tagBg }]}>
                  <Text style={s.bannerTagText}>{item.tag}</Text>
                </View>
                <Text style={s.bannerTitle}>{item.title}</Text>
                <Text style={s.bannerSub}>{item.sub}</Text>
              </View>
              <Image
                source={item.image}
                style={s.bannerImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* ── Dots ── */}
        <View style={s.dotsRow}>
          {BANNERS.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                bannerIndex.current = i;
                setActiveBanner(i);
                scrollRef.current?.scrollTo({
                  x: i * (BANNER_WIDTH + 20),
                  animated: true,
                });
              }}
            >
              <View
                style={[
                  s.dot,
                  {
                    backgroundColor: i === activeBanner ? C.primary : C.border,
                    width: i === activeBanner ? 20 : 7,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Today's Summary ── */}
        <View style={[s.summaryBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.summaryLeft}>
            <Text style={[s.summaryLabel, { color: C.subtext }]}>Today's Status</Text>
            <Text style={[s.summaryValue, { color: C.text }]}>
              {presentCount} of {children.length}
            </Text>
            <Text style={[s.summarySub, { color: C.muted }]}>children in school</Text>
          </View>
          <View style={[s.summaryPill, {
            backgroundColor: C.primary + "22",
            borderColor: C.primary + "44",
          }]}>
            <Text style={[s.summaryPillText, { color: C.primary }]}>
              {children.length === 0
                ? "—"
                : presentCount === children.length
                ? "All Present ✓"
                : `${children.length - presentCount} Absent`}
            </Text>
          </View>
        </View>

        {/* ── Children List ── */}
        <Text style={[s.sectionTitle, { color: C.subtext }]}>Your Children</Text>

        {children.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.emptyTitle, { color: C.text }]}>No children linked</Text>
            <Text style={[s.emptySub, { color: C.muted }]}>
              Contact your school admin to link your child.
            </Text>
          </View>
        ) : (
          children.map((child) => {
            const att = attendance[child.id];
            const status = getStatus(att);
            return (
              <View
                key={child.id}
                style={[s.childCard, { backgroundColor: C.card, borderColor: C.border }]}
              >
                {/* Avatar */}
                {child.photoUrl ? (
                  <Image source={{ uri: child.photoUrl }} style={s.childAvatar} />
                ) : (
                  <View style={[s.childAvatarPlaceholder, { backgroundColor: C.primary }]}>
                    <Text style={s.childAvatarText}>
                      {child.firstName[0]}{child.lastName[0]}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={s.childInfo}>
                  <Text style={[s.childName, { color: C.text }]} numberOfLines={1}>
                    {child.firstName} {child.lastName}
                  </Text>
                  <Text style={[s.gradeLevel, { color: C.muted }]}>
                    {child.gradeLevel?.replace("_", " ") ?? "No Grade"}
                  </Text>
                  <View style={[s.statusBadge, { backgroundColor: status.color + "22" }]}>
                    <View style={[s.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[s.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* Times */}
                <View style={s.times}>
                  <View style={s.timeBlock}>
                    <Text style={[s.timeLabel, { color: C.muted }]}>IN</Text>
                    <Text style={[s.timeVal, { color: C.text }]}>
                      {formatTime(att?.timeIn ?? null)}
                    </Text>
                  </View>
                  <View style={[s.timeDivider, { backgroundColor: C.border }]} />
                  <View style={s.timeBlock}>
                    <Text style={[s.timeLabel, { color: C.muted }]}>OUT</Text>
                    <Text style={[s.timeVal, { color: C.text }]}>
                      {formatTime(att?.timeOut ?? null)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:              { flex: 1 },
  centered:               { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header:                 { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerLeft:             { gap: 2 },
  greeting:               { fontSize: 13 },
  name:                   { fontSize: 22, fontWeight: "800" },
  avatar:                 { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:             { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Banner
  banner:                 { borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 148, overflow: "hidden", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  bannerLeft:             { flex: 1, gap: 6 },
  bannerTag:              { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 2 },
  bannerTagText:          { color: "#fff", fontSize: 11, fontWeight: "700" },
  bannerTitle:            { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 26 },
  bannerSub:              { color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 16 },
  bannerImage:            { width: 110, height: 110, marginLeft: 8 },

  // Dots
  dotsRow:                { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 20 },
  dot:                    { height: 7, borderRadius: 999 },

  // Summary
  summaryBanner:          { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLeft:            { gap: 2 },
  summaryLabel:           { fontSize: 12, fontWeight: "600" },
  summaryValue:           { fontSize: 24, fontWeight: "800" },
  summarySub:             { fontSize: 12 },
  summaryPill:            { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  summaryPillText:        { fontSize: 13, fontWeight: "700" },

  // Section title
  sectionTitle:           { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginHorizontal: 20, marginBottom: 12 },

  // Empty
  emptyCard:              { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 8 },
  emptyTitle:             { fontSize: 15, fontWeight: "700" },
  emptySub:               { fontSize: 13, textAlign: "center" },

  // Child card
  childCard:              { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  childAvatar:            { width: 54, height: 54, borderRadius: 27 },
  childAvatarPlaceholder: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  childAvatarText:        { color: "#fff", fontWeight: "800", fontSize: 18 },
  childInfo:              { flex: 1, gap: 3 },
  childName:              { fontSize: 15, fontWeight: "700" },
  gradeLevel:             { fontSize: 12 },
  statusBadge:            { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, gap: 4, marginTop: 2 },
  statusDot:              { width: 6, height: 6, borderRadius: 3 },
  statusText:             { fontSize: 11, fontWeight: "600" },

  // Times
  times:                  { flexDirection: "row", alignItems: "center", gap: 10 },
  timeBlock:              { alignItems: "center", gap: 2 },
  timeLabel:              { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  timeVal:                { fontSize: 13, fontWeight: "700" },
  timeDivider:            { width: 1, height: 28 },
});