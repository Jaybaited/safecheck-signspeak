import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

export default function ParentAttendance() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await api.get(`/users/my-children/${user?.id}`);
      setChildren(res.data);
      if (res.data.length > 0) {
        setSelectedChild(res.data[0]);
        fetchAttendance(res.data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (childId: string) => {
    setLoadingRecords(true);
    try {
      const res = await api.get(`/attendance/student/${childId}`);
      setRecords(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    fetchAttendance(child.id);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatus = (record: AttendanceRecord) => {
    if (!record.timeIn) return { label: "Absent", color: "#EF4444" };
    const hour = new Date(record.timeIn).getHours();
    const min = new Date(record.timeIn).getMinutes();
    if (hour > 8 || (hour === 8 && min > 0)) return { label: "Late", color: "#F59E0B" };
    return { label: "Present", color: "#10B981" };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
      </View>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.childSelector}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childTab,
                selectedChild?.id === child.id && styles.childTabActive,
              ]}
              onPress={() => handleSelectChild(child)}
            >
              <Text
                style={[
                  styles.childTabText,
                  selectedChild?.id === child.id && styles.childTabTextActive,
                ]}
              >
                {child.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Records */}
      {loadingRecords ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No attendance records found.</Text>
            </View>
          ) : (
            records.map((record) => {
              const status = getStatus(record);
              return (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "22" }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordRight}>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>IN</Text>
                      <Text style={styles.timeValue}>{formatTime(record.timeIn)}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>OUT</Text>
                      <Text style={styles.timeValue}>{formatTime(record.timeOut)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  childSelector: { marginBottom: 12 },
  childTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1E1E3A",
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  childTabActive: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  childTabText: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
  childTabTextActive: { color: "#FFFFFF" },
  list: { padding: 24, gap: 10 },
  emptyCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  recordCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  recordLeft: { gap: 6 },
  recordDate: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  recordRight: { alignItems: "flex-end", gap: 6 },
  timeRow: { alignItems: "flex-end" },
  timeLabel: { color: "#6B7280", fontSize: 10, fontWeight: "600" },
  timeValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
