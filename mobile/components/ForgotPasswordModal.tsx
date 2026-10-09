import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Maps backend/axios errors to the same friendly messages used on web.
function toFriendlyError(error: any): string {
  const status = error?.response?.status;
  const raw: string =
    (Array.isArray(error?.response?.data?.message)
      ? error.response.data.message.join(", ")
      : error?.response?.data?.message) ||
    error?.message ||
    "Something went wrong.";
  const lower = raw.toLowerCase();

  if (status === 429 || lower.includes("too many requests") || raw.includes("ThrottlerException"))
    return "Too many attempts. Please wait about 15 minutes before trying again.";
  if (lower.includes("incorrect username") || lower.includes("no account"))
    return "Incorrect username, please try again.";
  if (lower.includes("pending"))
    return "You already have a pending request. Please wait for your admin to approve it.";
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error")
    return "Cannot reach the server. Check your internet connection.";
  return raw;
}

export default function ForgotPasswordModal({ visible, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setUsername("");
    setSuccessMsg(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setErrorMsg("Please enter your username.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.post("/password-reset/request", { username: username.trim() });
      setSuccessMsg(res.data?.message ?? "Request submitted.");
      setUsername("");
    } catch (error: any) {
      setErrorMsg(toFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.iconCircle}>
                <Ionicons name="key-outline" size={18} color="#fff" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={s.title}>Forgot Password?</Text>
                <Text style={s.subtitle}>Submit a reset request to your admin</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#9A7070" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={s.body}>
            {!successMsg ? (
              <>
                <Text style={s.helper}>
                  Enter your username below. Your school admin will receive your request and
                  generate a new password for you.
                </Text>

                <Text style={s.label}>USERNAME</Text>
                <View style={s.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#8B1A1A" style={{ marginRight: 8 }} />
                  <TextInput
                    style={s.input}
                    value={username}
                    onChangeText={(t) => { setUsername(t); setErrorMsg(null); }}
                    placeholder="e.g. santos.123456"
                    placeholderTextColor="#C4A0A0"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    editable={!loading}
                  />
                </View>

                {errorMsg && (
                  <View style={s.errorBox}>
                    <Ionicons name="close-circle" size={16} color="#DC2626" />
                    <Text style={s.errorText}>{errorMsg}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={s.successWrap}>
                <View style={s.successCircle}>
                  <Ionicons name="checkmark-circle" size={36} color="#10B981" />
                </View>
                <Text style={s.successTitle}>Request Submitted!</Text>
                <Text style={s.successText}>{successMsg}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelText}>{successMsg ? "Close" : "Cancel"}</Text>
            </TouchableOpacity>
            {!successMsg && (
              <TouchableOpacity
                style={[s.submitBtn, (loading || !username.trim()) && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={loading || !username.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#fff" />
                    <Text style={s.submitText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#F3E4E4",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#8B1A1A",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#1A0505", fontSize: 15, fontWeight: "700" },
  subtitle: { color: "#9A7070", fontSize: 12, marginTop: 1 },
  body: { paddingHorizontal: 20, paddingVertical: 18 },
  helper: { color: "#7A4040", fontSize: 13, lineHeight: 19, marginBottom: 16 },
  label: { color: "#4A1A1A", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FDF4F4",
    borderWidth: 1.5, borderColor: "#E8C4C4", borderRadius: 14, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, color: "#1A0505", fontSize: 15 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: 12, padding: 12,
  },
  errorText: { flex: 1, color: "#DC2626", fontSize: 12 },
  successWrap: { alignItems: "center", paddingVertical: 8, gap: 8 },
  successCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#ECFDF5",
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { color: "#1A0505", fontSize: 15, fontWeight: "700" },
  successText: { color: "#7A4040", fontSize: 13, textAlign: "center", lineHeight: 19 },
  footer: {
    flexDirection: "row", justifyContent: "flex-end", gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: "#F3E4E4", backgroundColor: "#FDF9F9",
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cancelText: { color: "#7A4040", fontSize: 14 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#8B1A1A", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});