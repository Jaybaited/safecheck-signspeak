import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Image, Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { registerPushToken } from "../lib/notifications";

const { width, height } = Dimensions.get("window");

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
        case "STUDENT":  router.replace("/(student)");  break;
        case "PARENT":   router.replace("/(parent)");   break;
        case "TEACHER":  router.replace("/(teacher)");  break;
        case "ADMIN":    router.replace("/(admin)");    break;
        default:
          Alert.alert("Error", "Unknown role. Contact administrator.");
      }
   } catch (error: any) {
  console.log('=== LOGIN ERROR ===');
  console.log('Message:', error?.message);
  console.log('Code:', error?.code);
  console.log('Response:', error?.response?.data);
  console.log('Status:', error?.response?.status);
  
  const message =
    error?.response?.data?.message || error?.message || "Invalid username or password.";
  Alert.alert("Login Failed", message);
} finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={s.logoWrap}>
            <Image
              source={require("../assets/images/SignSpeak-removebg-preview.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {/* ── Illustration ── */}
          <View style={s.illustrationWrap}>
            <Image
              source={require("../assets/images/login-illustration.png")}
              style={s.illustration}
              resizeMode="contain"
            />
          </View>

          {/* ── Card ── */}
          <View style={s.card}>
            {/* Header */}
            <Text style={s.title}>Welcome Back!</Text>
            <Text style={s.subtitle}>Sign in to your account to continue</Text>

            {/* Username */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Username</Text>
              <View style={s.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#C4A0A0"
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#C4A0A0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#C4A0A0"
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#C4A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={s.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#C4A0A0"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={s.signInBtn}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <Text style={s.footer}>SafeCheck Attendance System v1.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF4F4" },
  scroll: { flexGrow: 1 },

  // Logo — top center like the reference image
  logoWrap: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 4,
  },
  logo: {
    width: 140,
    height: 48,
  },

  // Illustration — smaller, centered, like the reference
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  illustration: {
    width: width * 0.55,   // smaller than before (was 0.82)
    height: height * 0.22, // shorter than before (was 0.38)
  },

  // Card — white rounded top card (same as before)
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },

  title: {
    color: "#1A0505",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#7A4040",
    fontSize: 14,
    marginBottom: 24,
  },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: {
    color: "#4A1A1A",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF4F4",
    borderWidth: 1.5,
    borderColor: "#E8C4C4",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: "#1A0505",
    fontSize: 15,
  },
  eyeBtn: { paddingLeft: 8, paddingVertical: 4 },

  // Button
  signInBtn: {
    width: "100%",
    backgroundColor: "#8B1A1A",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  signInText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Footer
  footer: {
    textAlign: "center",
    color: "#C4A0A0",
    fontSize: 12,
    marginTop: 24,
  },
});