import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { CheckCircle, XCircle } from "lucide-react-native";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

export default function AttendanceScreen() {
  const { user, token } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await api.get(`/attendance/student/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

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
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>{records.length} total records</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRecords();
            }}
            tintColor="#8B5CF6"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              {item.timeIn ? (
                <CheckCircle color="#10B981" size={20} />
              ) : (
                <XCircle color="#EF4444" size={20} />
              )}
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                <Text style={styles.statusLabel}>
                  {item.timeIn ? "Present" : "Absent"}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.timeText}>In: {formatTime(item.timeIn)}</Text>
              <Text style={styles.timeText}>Out: {formatTime(item.timeOut)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23" },
  centered: {
    flex: 1,
    backgroundColor: "#0F0F23",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "#1E1E3A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: 13, color: "#FFFFFF", fontWeight: "500" },
  statusLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 2 },
  timeText: { fontSize: 12, color: "#9CA3AF" },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});
