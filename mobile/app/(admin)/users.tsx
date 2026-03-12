import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string | null;
  gradeLevel: string | null;
}

const ROLE_FILTERS = ["ALL", "STUDENT", "TEACHER", "PARENT", "ADMIN"];

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "#8B5CF6",
  TEACHER: "#10B981",
  PARENT: "#F59E0B",
  ADMIN: "#EF4444",
};

export default function UsersScreen() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFiltered(res.data);
    } catch {
      setUsers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const applyFilter = (role: string) => {
    setActiveFilter(role);
    if (role === "ALL") {
      setFiltered(users);
    } else {
      setFiltered(users.filter((u) => u.role === role));
    }
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
        <Text style={styles.title}>Manage Users</Text>
        <Text style={styles.subtitle}>{filtered.length} users</Text>
      </View>

      {/* Role Filter */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterBtn,
              activeFilter === role && styles.filterBtnActive,
            ]}
            onPress={() => applyFilter(role)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === role && styles.filterTextActive,
              ]}
            >
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUsers();
            }}
            tintColor="#8B5CF6"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    (ROLE_COLORS[item.role] || "#8B5CF6") + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: ROLE_COLORS[item.role] || "#8B5CF6" },
                ]}
              >
                {item.firstName[0]}
                {item.lastName[0]}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.userUsername}>@{item.username}</Text>
              {item.gradeLevel && (
                <Text style={styles.gradeText}>{item.gradeLevel.replace("_", " ")}</Text>
              )}
            </View>
            <View
              style={[
                styles.roleBadge,
                {
                  borderColor: ROLE_COLORS[item.role] || "#8B5CF6",
                  backgroundColor:
                    (ROLE_COLORS[item.role] || "#8B5CF6") + "15",
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  { color: ROLE_COLORS[item.role] || "#8B5CF6" },
                ]}
              >
                {item.role}
              </Text>
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
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1E1E3A",
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  filterBtnActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "#1E1E3A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D4E",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  userUsername: { fontSize: 12, color: "#9CA3AF" },
  gradeText: { fontSize: 11, color: "#6B7280" },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: "600" },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});
