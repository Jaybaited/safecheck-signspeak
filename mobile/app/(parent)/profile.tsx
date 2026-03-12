import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";

export default function ParentProfile() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Parent</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>@{user?.username}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>Parent</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23", padding: 24 },
  header: { paddingTop: 36, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  avatarContainer: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  fullName: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#8B5CF622",
    borderRadius: 999,
  },
  roleText: { color: "#8B5CF6", fontSize: 12, fontWeight: "600" },
  infoCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: { color: "#9CA3AF", fontSize: 14 },
  infoValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#2D2D4E" },
  logoutBtn: {
    backgroundColor: "#EF444422",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
});
