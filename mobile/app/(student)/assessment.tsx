import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../store/themeStore";
import { getColors, ThemeColors } from "../../lib/theme";
import { getStatusColor } from "../../lib/statusColors";
import {
  getMyLevels,
  getApiErrorMessage,
  isPasswordChangeRequired,
  LevelCard,
  LevelState,
} from "../../lib/assessments-api";

type IconName = keyof typeof Ionicons.glyphMap;

const STATE_LABEL: Record<LevelState, string> = {
  LOCKED: "Locked",
  AVAILABLE: "Start",
  IN_PROGRESS: "Continue",
  AWAITING_REVIEW: "Waiting for review",
  FAILED: "Try again",
  PASSED: "Passed",
};

const STATE_ICON: Record<LevelState, IconName> = {
  LOCKED: "lock-closed-outline",
  AVAILABLE: "play-circle-outline",
  IN_PROGRESS: "play-circle-outline",
  AWAITING_REVIEW: "time-outline",
  FAILED: "refresh-outline",
  PASSED: "checkmark-circle-outline",
};

function LevelItem({
  item,
  theme,
  colors,
  onOpen,
}: {
  item: LevelCard;
  theme: "light" | "dark";
  colors: ThemeColors;
  onOpen: (item: LevelCard) => void;
}) {
  const locked = item.state === "LOCKED";
  const badge = getStatusColor(item.state, theme);
  // Score is shown only after an admin releases the result (PASSED or FAILED)
  const showScore = (item.state === "PASSED" || item.state === "FAILED") && item.score != null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={locked}
      onPress={() => onOpen(item)}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        locked && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`Level ${item.level}, ${STATE_LABEL[item.state]}`}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.levelText, { color: colors.primary }]}>Level {item.level}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.count, { color: colors.subtext }]}>{item.questionCount} questions</Text>
      </View>

      {!locked && !!item.lessonDescription && (
        <Text style={[styles.description, { color: colors.subtext }]} numberOfLines={3}>
          {item.lessonDescription}
        </Text>
      )}

      {locked && (
        <Text style={[styles.description, { color: colors.subtext }]}>
          Pass Level {item.level - 1} to unlock this level.
        </Text>
      )}

      {showScore && (
        <Text style={[styles.score, { color: colors.text }]}>
          Score: {item.score}% (pass mark {item.passMark}%)
        </Text>
      )}

      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Ionicons name={STATE_ICON[item.state]} size={16} color={badge.fg} />
        <Text style={[styles.badgeText, { color: badge.fg }]}>{STATE_LABEL[item.state]}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AssessmentScreen() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.resolvedTheme);
  const colors = getColors(theme);

  const [levels, setLevels] = useState<LevelCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      try {
        const data = await getMyLevels();
        setLevels(data);
        setError(null);
      } catch (e) {
        if (isPasswordChangeRequired(e)) {
          router.replace("/change-password" as any);
          return;
        }
        setError(getApiErrorMessage(e, "Could not load the levels."));
      } finally {
        setRefreshing(false);
      }
    },
    [router],
  );

  // Reload every time the screen is focused (e.g. after finishing an exam)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const retry = () => {
    setError(null);
    setLevels(null);
    load();
  };

  const openLevel = (item: LevelCard) => {
    if (item.state === "LOCKED") return;
    router.push({ pathname: "/(student)/assessment-run", params: { id: item.id } } as any);
  };

  let body: React.ReactNode;
  if (error) {
    body = (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
        <Text style={[styles.stateText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={retry}
          activeOpacity={0.85}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (levels === null) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (levels.length === 0) {
    body = (
      <View style={styles.center}>
        <Ionicons name="clipboard-outline" size={40} color={colors.muted} />
        <Text style={[styles.stateText, { color: colors.subtext }]}>
          No assessments are available yet.
        </Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={levels}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <LevelItem item={item} theme={theme} colors={colors} onOpen={openLevel} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Assessments</Text>
        <Text style={[styles.headerSub, { color: colors.subtext }]}>
          Watch the lesson, then answer the questions. Pass a level to open the next one.
        </Text>
      </View>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  headerSub: { fontSize: 13, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  stateText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  levelText: { fontSize: 13, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  count: { fontSize: 12 },
  description: { fontSize: 14, lineHeight: 20 },
  score: { fontSize: 14, fontWeight: "700" },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 13, fontWeight: "700" },
});