import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";

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

export default function ParentHome() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<Record<string, TodayAttendance>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

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
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning,";
    if (h < 18) return "Good afternoon,";
    return "Good evening,";
  };

  const getStatus = (att: TodayAttendance | undefined) => {
    if (!att?.timeIn) return { label: "Absent", color: "#EF4444" };
    if (!att.timeOut) return { label: "In School", color: "#10B981" };
    return { label: "Went Home", color: "#8B5CF6" };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Today's Status</Text>
        <Text style={styles.bannerValue}>
          {children.filter(c => attendance[c.id]?.timeIn).length}/{children.length} children in school
        </Text>
      </View>

      {/* Children List */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Children</Text>

        {children.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No children linked</Text>
            <Text style={styles.emptySubtitle}>Contact your school admin to link your child.</Text>
          </View>
        ) : (
          children.map((child) => {
            const att = attendance[child.id];
            const status = getStatus(att);
            return (
              <View key={child.id} style={styles.childCard}>
                {/* Left — Avatar + Info */}
                <View style={styles.cardLeft}>
                  {child.photoUrl ? (
                    <Image source={{ uri: child.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {child.firstName[0]}{child.lastName[0]}
                      </Text>
                    </View>
                  )}
                  <View style={styles.childInfo}>
                    <Text style={styles.childName} numberOfLines={1}>
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text style={styles.gradeLevel}>
                      {child.gradeLevel?.replace("_", " ") ?? "No Grade"}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "22" }]}>
                      <View style={[styles.dot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right — Times */}
                <View style={styles.cardRight}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>TIME IN</Text>
                    <Text style={styles.timeValue}>{formatTime(att?.timeIn ?? null)}</Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>TIME OUT</Text>
                    <Text style={styles.timeValue}>{formatTime(att?.timeOut ?? null)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23" },
  centered: { flex: 1, backgroundColor: "#0F0F23", justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: { fontSize: 13, color: "#9CA3AF" },
  name: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  dateBadge: {
    backgroundColor: "#1E1E3A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  dateText: { color: "#8B5CF6", fontSize: 13, fontWeight: "600" },

  // Banner
  banner: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: "#8B5CF611",
    borderWidth: 1,
    borderColor: "#8B5CF633",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLabel: { color: "#9CA3AF", fontSize: 13 },
  bannerValue: { color: "#8B5CF6", fontSize: 13, fontWeight: "700" },

  // List
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },

  // Empty
  emptyCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  emptySubtitle: { color: "#6B7280", fontSize: 13, textAlign: "center" },

  // Child Card
  childCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  childInfo: { flex: 1, gap: 3 },
  childName: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  gradeLevel: { color: "#9CA3AF", fontSize: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
    marginTop: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },

  // Times
  cardRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginLeft: 8,
  },
  timeBlock: { alignItems: "center", gap: 2 },
  timeLabel: { color: "#6B7280", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  timeValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  timeDivider: { width: 1, height: 28, backgroundColor: "#2D2D4E" },
});
