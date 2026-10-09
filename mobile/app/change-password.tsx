import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const HOME: Record<string, string> = {
  STUDENT: "/(student)",
  PARENT: "/(parent)",
  TEACHER: "/(teacher)",
  ADMIN: "/(admin)",
};

const rules = (p: string): [string, boolean][] => [
  ["8+ characters", p.length >= 8],
  ["One uppercase letter", /[A-Z]/.test(p)],
  ["One lowercase letter", /[a-z]/.test(p)],
  ["One number", /\d/.test(p)],
  ["One special character", /[^A-Za-z0-9]/.test(p)],
];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (rules(newPassword).some(([, ok]) => !ok)) {
      Alert.alert("Error", "Password does not meet all requirements.");
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/users/${user.id}/force-change-password`, { newPassword });
      setUser({ ...user, mustChangePassword: false });
      router.replace((HOME[user.role] ?? "/login") as any);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      Alert.alert("Failed", Array.isArray(m) ? m.join("\n") : m || e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.title}>Set Your Password</Text>
            <Text style={s.subtitle}>
              You must set a new password before you can continue.
            </Text>

            <Text style={s.label}>New Password</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={newPassword}
                onChangeText={setNew}
                secureTextEntry={!show}
                autoCapitalize="none"
                placeholder="Min. 8 characters"
              />
              <TouchableOpacity onPress={() => setShow(!show)}>
                <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color="#9B6B6B" />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Confirm Password</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!show}
                autoCapitalize="none"
                placeholder="Re-enter new password"
              />
            </View>

            {rules(newPassword).map(([label, ok]) => (
              <Text key={label} style={{ color: ok ? "#059669" : "#9CA3AF", fontSize: 12, marginTop: 2 }}>
                {ok ? "✓" : "·"} {label}
              </Text>
            ))}

            <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Set Password & Continue</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={logout} style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ color: "#8B1A1A", fontWeight: "600" }}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF4F4" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 28, padding: 28, elevation: 6 },
  title: { color: "#1A0505", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#7A4040", fontSize: 14, marginBottom: 20 },
  label: { color: "#4A1A1A", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FDF4F4",
    borderWidth: 1.5, borderColor: "#E8C4C4", borderRadius: 14, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 14, color: "#1A0505", fontSize: 15 },
  btn: { backgroundColor: "#8B1A1A", paddingVertical: 16, borderRadius: 18, alignItems: "center", marginTop: 20 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});