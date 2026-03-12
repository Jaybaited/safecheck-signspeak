import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays } from "lucide-react-native";

export default function AdminAttendanceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <CalendarDays color="#8B5CF6" size={48} />
        <Text style={styles.title}>Attendance Records</Text>
        <Text style={styles.subtitle}>Full attendance management coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F23" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
});
