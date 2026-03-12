import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { User, Settings, TrendingUp, LogOut, ChevronRight } from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          clearAuth();
          router.replace("/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: <TrendingUp color="#8B5CF6" size={20} />,
      label: "My Progress",
      onPress: () => Alert.alert("Coming Soon", "FSL progress tracking coming soon."),
    },
    {
      icon: <Settings color="#8B5CF6" size={20} />,
      label: "Settings",
      onPress: () => Alert.alert("Coming Soon", "Settings coming soon."),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User color="#8B5CF6" size={32} />
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
          >
            {item.icon}
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight color="#6B7280" size={18} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color="#EF4444" size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2D2D4E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  username: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  roleBadge: {
    backgroundColor: "#2D2D4E",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    marginTop: 4,
  },
  roleText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "600",
  },
  menuCard: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D4E",
  },
  menuLabel: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  logoutBtn: {
    backgroundColor: "#1E1E3A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
});
