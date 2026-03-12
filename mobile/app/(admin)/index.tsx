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
import { Users, GraduationCap, UserCheck, ShieldCheck } from "lucide-react-native";

interface UserStats {
  adminCount: number;
  teacherCount: number;
  studentCount: number;
  parentCount: number;
}

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get("/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Students",
          value: stats.studentCount,
          icon: <GraduationCap color="#8B5CF6" size={24} />,
          color: "#8B5CF6",
        },
        {
          label: "Teachers",
          value: stats.teacherCount,
          icon: <UserCheck color="#10B981" size={24} />,
          color: "#10B981",
        },
        {
          label: "Parents",
          value: stats.parentCount,
          icon: <Users color="#F59E0B" size={24} />,
          color: "#F59E0B",
        },
        {
          label: "Admins",
          value: stats.adminCount,
          icon: <ShieldCheck color="#EF4444" size={24} />,
          color: "#EF4444",
        },
      ]
    : [];

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
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName} 👋
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Admin</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <View key={index} style={styles.statCard}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: card.color + "20" },
                ]}
              >
                {card.icon}
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>SafeCheck–SignSpeak</Text>
          <Text style={styles.infoText}>
            RFID-Based Attendance & FSL Recognition System for Philippine School for the Deaf
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 14, color: "#9CA3AF" },
  name: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  roleBadge: {
    backgroundColor: "#1E1E3A",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { color: "#8B5CF6", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D4E",
    width: "47%",
    marginHorizontal: "1.5%",
    gap: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  statLabel: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  infoCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
    gap: 6,
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#8B5CF6" },
  infoText: { fontSize: 13, color: "#9CA3AF", lineHeight: 20 },
});
