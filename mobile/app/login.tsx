import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { registerPushToken } from "../lib/notifications";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { username, password });
      const { accessToken, user } = response.data;

      setAuth(accessToken, user);
      if (user.role === "PARENT") {
        registerPushToken().catch(console.error);
      }

      switch (user.role) {
        case "STUDENT":
          router.replace("/(student)");
          break;
        case "PARENT":
          router.replace("/(parent)");
          break;
        case "TEACHER":
        case "ADMIN":
          router.replace("/(admin)");
          break;
        default:
          Alert.alert("Error", "Unknown role. Contact administrator.");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Invalid username or password.";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>

        {/* Logo + Brand */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={["#22D3EE", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Ionicons name="wifi" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandText}>
            Safe<Text style={styles.brandAccent}>Check</Text>
          </Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Card */}
        <View style={styles.card}>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#6B7280"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={loading ? ["#4B3A8A", "#4B3A8A"] : ["#22D3EE", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>SafeCheck Attendance System v1.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  brandAccent: {
    color: "#22D3EE",
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  card: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#2D2D4E",
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#D1D5DB",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F0F23",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    color: "#FFFFFF",
    fontSize: 15,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  buttonWrapper: {
    marginTop: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 999,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 8,
  },
});
