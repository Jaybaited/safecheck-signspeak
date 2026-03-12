import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  sentAt: string;
  status: string;
}

export default function ParentNotifications() {
  const insets = useSafeAreaInsets();
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

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIcon = (message: string) => {
    if (message.toLowerCase().includes("entered")) return "enter-outline";
    if (message.toLowerCase().includes("left")) return "exit-outline";
    return "notifications-outline";
  };

  const getIconColor = (message: string) => {
    if (message.toLowerCase().includes("entered")) return "#10B981";
    if (message.toLowerCase().includes("left")) return "#8B5CF6";
    return "#6B7280";
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
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          {notifications.length} alert{notifications.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={52} color="#2D2D4E" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll see alerts here when your child enters or leaves school
            </Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <View key={notif.id} style={styles.card}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconColor(notif.message) + "22" },
                ]}
              >
                <Ionicons
                  name={getIcon(notif.message) as any}
                  size={20}
                  color={getIconColor(notif.message)}
                />
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.message}>{notif.message}</Text>
                <Text style={styles.time}>{formatTime(notif.sentAt)}</Text>
              </View>

              {/* Status dot */}
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      notif.status === "SENT" ? "#10B981" : "#EF4444",
                  },
                ]}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23" },
  centered: {
    flex: 1,
    backgroundColor: "#0F0F23",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E3A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "#6B7280" },
  list: { padding: 24, gap: 10 },
  emptyState: {
    alignItems: "center",
    gap: 12,
    marginTop: 80,
  },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  card: {
    backgroundColor: "#1E1E3A",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 4 },
  message: { color: "#FFFFFF", fontSize: 14, fontWeight: "500", lineHeight: 20 },
  time: { color: "#6B7280", fontSize: 12 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
