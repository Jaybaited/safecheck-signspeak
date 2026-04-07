import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  sentAt: string;
  status: string;
}

export default function ParentNotifications() {
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications/my-notifications");
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getNotifMeta = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes("entered") || lower.includes("check in") || lower.includes("arrived")) {
      return { icon: "enter-outline" as const, color: "#10B981", label: "Check In" };
    }
    if (lower.includes("left") || lower.includes("check out") || lower.includes("exit")) {
      return { icon: "exit-outline" as const, color: C.primary, label: "Check Out" };
    }
    return { icon: "notifications-outline" as const, color: C.muted, label: "Notice" };
  };

  // ── Loading State ──────────────────────────────────────────────────────────
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

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.border, backgroundColor: C.background },
        ]}
      >
        <View style={[styles.headerIconBadge, { backgroundColor: C.primary + "22" }]}>
          <Ionicons name="notifications-outline" size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Notifications</Text>
          <Text style={[styles.headerSub, { color: C.muted }]}>
            {notifications.length} alert{notifications.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconRing, { borderColor: C.border }]}>
              <Ionicons name="notifications-off-outline" size={36} color={C.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySub, { color: C.muted }]}>
              You'll see alerts here when your child enters or leaves school
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const meta = getNotifMeta(item.message);
          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  marginTop: index === 0 ? 0 : 10,
                },
              ]}
            >
              

              {/* Icon */}
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: meta.color + "22" },
                ]}
              >
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.labelPill,
                      { backgroundColor: meta.color + "22" },
                    ]}
                  >
                    <Text style={[styles.labelPillText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                  {/* Status dot */}
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          item.status === "SENT" ? "#10B981" : "#EF4444",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.message, { color: C.text }]}>{item.message}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={12} color={C.muted} />
                  <Text style={[styles.timeText, { color: C.muted }]}>
                    {formatTime(item.sentAt)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub:   { fontSize: 12, marginTop: 1 },

  // ── List ────────────────────────────────────
  listContent:    { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: "center" },

  // ── Card ────────────────────────────────────
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft:14,
    gap: 12,
  },
  
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 6 },
  cardTopRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  labelPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  labelPillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  message:  { fontSize: 13, fontWeight: "500", lineHeight: 19 },
  timeRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 11 },

  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // ── Empty State ─────────────────────────────
  emptyState:   { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyIconRing: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub:   { fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 260 },
});