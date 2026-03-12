import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react-native";

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

export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const [today, setToday] = useState<AttendanceToday | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
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
      setRecent(recentRes.data.slice(0, 5));
    } catch {
      setToday(null);
      setRecent([]);
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

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isPresent = today?.timeIn != null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName} 👋
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Student</Text>
          </View>
        </View>

        {/* Today's Attendance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CalendarDays color="#8B5CF6" size={18} />
            <Text style={styles.cardTitle}>Today's Attendance</Text>
          </View>

          <View style={styles.statusRow}>
            {isPresent ? (
              <CheckCircle color="#10B981" size={20} />
            ) : (
              <XCircle color="#EF4444" size={20} />
            )}
            <Text
              style={[
                styles.statusText,
                { color: isPresent ? "#10B981" : "#EF4444" },
              ]}
            >
              {isPresent ? "Present" : "Absent"}
            </Text>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Clock color="#8B5CF6" size={14} />
              <Text style={styles.timeLabel}>Time In</Text>
              <Text style={styles.timeValue}>{formatTime(today?.timeIn ?? null)}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeBox}>
              <Clock color="#6B7280" size={14} />
              <Text style={styles.timeLabel}>Time Out</Text>
              <Text style={styles.timeValue}>{formatTime(today?.timeOut ?? null)}</Text>
            </View>
          </View>
        </View>

        {/* Recent Attendance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CalendarDays color="#8B5CF6" size={18} />
            <Text style={styles.cardTitle}>Recent Attendance</Text>
          </View>

          {recent.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          ) : (
            recent.map((record) => (
              <View key={record.id} style={styles.recordRow}>
                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                <View style={styles.recordTimes}>
                  <Text style={styles.recordTime}>
                    In: {formatTime(record.timeIn)}
                  </Text>
                  <Text style={styles.recordTime}>
                    Out: {formatTime(record.timeOut)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0F0F23",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  roleBadge: {
    backgroundColor: "#1E1E3A",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  timeDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#2D2D4E",
  },
  timeLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D4E",
  },
  recordDate: {
    fontSize: 13,
    color: "#D1D5DB",
    fontWeight: "500",
  },
  recordTimes: {
    alignItems: "flex-end",
    gap: 2,
  },
  recordTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
});
