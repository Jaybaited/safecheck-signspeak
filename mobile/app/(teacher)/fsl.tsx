import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import { BookOpen, TrendingUp, Award, Target } from "lucide-react-native";

interface FSLProgress {
  id: string;
  student: { firstName: string; lastName: string; username: string };
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  lastActivity: string;
  level: string;
}

export default function TeacherFSLScreen() {
  const { token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [progress, setProgress]     = useState<FSLProgress[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get("/fsl/progress/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgress(res.data);
    } catch {
      setProgress([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchProgress(); }, []);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return "#10B981";
    if (acc >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const avgAccuracy = progress.length
    ? Math.round(progress.reduce((a, b) => a + b.accuracy, 0) / progress.length)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#8B1A1A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <View style={[s.headerIcon, { backgroundColor: "#B4530922" }]}>
          <BookOpen size={18} color="#B45309" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: C.text }]}>FSL Progress</Text>
          <Text style={[s.headerSub, { color: C.muted }]}>
            {progress.length} student{progress.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Class Summary Strip */}
      <View style={[s.summaryStrip, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        {[
          { label: "Students",  value: progress.length,   color: C.primary  },
          { label: "Avg Score", value: `${avgAccuracy}%`, color: getAccuracyColor(avgAccuracy) },
          { label: "Top Score", value: progress.length ? `${Math.max(...progress.map(p => p.accuracy))}%` : "—", color: "#10B981" },
        ].map((item, i, arr) => (
          <View key={i} style={s.stripItem}>
            <Text style={[s.stripValue, { color: item.color }]}>{item.value}</Text>
            <Text style={[s.stripLabel, { color: C.muted }]}>{item.label}</Text>
            {i < arr.length - 1 && <View style={[s.stripDivider, { backgroundColor: C.border }]} />}
          </View>
        ))}
      </View>

      <FlatList
        data={progress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, progress.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchProgress(); }}
            tintColor="#8B1A1A"
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyRing, { borderColor: C.border }]}>
              <BookOpen size={34} color={C.muted} />
            </View>
            <Text style={[s.emptyTitle, { color: C.text }]}>No FSL data yet</Text>
            <Text style={[s.emptySub, { color: C.muted }]}>
              Student progress will appear here once they start practicing
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const accColor = getAccuracyColor(item.accuracy);
          return (
            <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Avatar */}
              <View style={[s.avatar, { backgroundColor: accColor + "22" }]}>
                <Text style={[s.avatarText, { color: accColor }]}>
                  {item.student.firstName[0]}{item.student.lastName[0]}
                </Text>
              </View>

              {/* Info */}
              <View style={s.cardInfo}>
                <Text style={[s.cardName, { color: C.text }]}>
                  {item.student.firstName} {item.student.lastName}
                </Text>
                <Text style={[s.cardSub, { color: C.muted }]}>@{item.student.username}</Text>

                {/* Progress bar */}
                <View style={[s.progressTrack, { backgroundColor: C.border }]}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${Math.min(item.accuracy, 100)}%`, backgroundColor: accColor },
                    ]}
                  />
                </View>

                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Target size={11} color={C.muted} />
                    <Text style={[s.statText, { color: C.muted }]}>
                      {item.correctAnswers}/{item.totalAttempts}
                    </Text>
                  </View>
                  <View style={s.statItem}>
                    <TrendingUp size={11} color={accColor} />
                    <Text style={[s.statText, { color: accColor, fontWeight: "700" }]}>
                      {item.accuracy}%
                    </Text>
                  </View>
                  {item.level && (
                    <View style={s.statItem}>
                      <Award size={11} color="#B45309" />
                      <Text style={[s.statText, { color: "#B45309" }]}>{item.level}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Accuracy badge */}
              <View style={[s.accBadge, { backgroundColor: accColor + "22" }]}>
                <Text style={[s.accText, { color: accColor }]}>{item.accuracy}%</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerIcon:   { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle:  { fontSize: 20, fontWeight: "700" },
  headerSub:    { fontSize: 12, marginTop: 1 },
  summaryStrip: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1 },
  stripItem:    { flex: 1, alignItems: "center", gap: 2, position: "relative" },
  stripValue:   { fontSize: 20, fontWeight: "800" },
  stripLabel:   { fontSize: 11 },
  stripDivider: { position: "absolute", right: 0, top: "10%", width: 1, height: "80%" },
  list:         { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontSize: 15, fontWeight: "800" },
  cardInfo:     { flex: 1, gap: 5 },
  cardName:     { fontSize: 14, fontWeight: "700" },
  cardSub:      { fontSize: 11 },
  progressTrack:{ height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  statsRow:     { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statItem:     { flexDirection: "row", alignItems: "center", gap: 3 },
  statText:     { fontSize: 11 },
  accBadge:     { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  accText:      { fontSize: 13, fontWeight: "800" },
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyRing:    { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  emptyTitle:   { fontSize: 16, fontWeight: "600" },
  emptySub:     { fontSize: 13, textAlign: "center", maxWidth: 260 },
});