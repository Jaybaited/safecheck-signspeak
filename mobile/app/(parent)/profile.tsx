import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Modal, Image, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import {
  Bell, LogOut, ChevronRight,
  Sun, Moon, Smartphone, ChevronDown, Check, Pencil, X,
} from "lucide-react-native";

const THEME_OPTIONS = [
  { label: "Light",  value: "light",  icon: Sun },
  { label: "Dark",   value: "dark",   icon: Moon },
  { label: "Device", value: "device", icon: Smartphone },
] as const;

const AVATARS = [
  { id: 1, source: require("../../assets/images/avatars/avatar1.png") },
  { id: 2, source: require("../../assets/images/avatars/avatar2.png") },
  { id: 3, source: require("../../assets/images/avatars/avatar3.png") },
  { id: 4, source: require("../../assets/images/avatars/avatar4.png") },
  { id: 5, source: require("../../assets/images/avatars/avatar5.png") },
  { id: 6, source: require("../../assets/images/avatars/avatar6.png") },
];

export default function ParentProfile() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { mode, setMode, resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar]   = useState<number | null>(null);

  const activeOption = THEME_OPTIONS.find((o) => o.value === mode)!;

  const getInitials = () =>
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => { clearAuth(); router.replace("/login"); },
      },
    ]);
  };

  const menuItems = [
    {
      icon: Bell,
      label: "Notification Settings",
      sub: "Manage your alert preferences",
      onPress: () => Alert.alert("Coming Soon", "Notification settings coming soon."),
    },
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Profile Card ─────────────────────────────────────── */}
        <View style={[s.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {/* Avatar with edit button */}
          <TouchableOpacity
            style={s.avatarWrap}
            onPress={() => setAvatarPickerOpen(true)}
            activeOpacity={0.85}
          >
            {selectedAvatar !== null ? (
              <Image
                source={AVATARS.find((a) => a.id === selectedAvatar)!.source}
                style={s.avatarImage}
              />
            ) : (
              <View style={[s.avatar, { backgroundColor: C.primary }]}>
                <Text style={s.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={[s.editBadge, { backgroundColor: C.primary }]}>
              <Pencil size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[s.name, { color: C.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[s.username, { color: C.muted }]}>@{user?.username}</Text>
          <View style={[s.roleBadge, { backgroundColor: C.inputBg, borderColor: C.primary }]}>
            <Text style={[s.roleText, { color: C.primary }]}>Parent</Text>
          </View>
          <TouchableOpacity onPress={() => setAvatarPickerOpen(true)}>
            <Text style={[s.changePhotoText, { color: C.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar Picker Modal ──────────────────────────────── */}
        <Modal
          visible={avatarPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setAvatarPickerOpen(false)}
        >
          <View style={s.backdrop}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setAvatarPickerOpen(false)}
            />
          </View>
          <View style={s.pickerWrapper}>
            <View style={[s.pickerSheet, { backgroundColor: C.card }]}>
              <View style={[s.sheetHandle, { backgroundColor: C.border }]} />
              <View style={s.pickerHeader}>
                <View>
                  <Text style={[s.pickerTitle, { color: C.text }]}>Choose Avatar</Text>
                  <Text style={[s.pickerSub, { color: C.muted }]}>Pick a profile picture</Text>
                </View>
                <TouchableOpacity
                  style={[s.closeBtn, { backgroundColor: C.inputBg }]}
                  onPress={() => setAvatarPickerOpen(false)}
                >
                  <X size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={AVATARS}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={s.avatarGrid}
                columnWrapperStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                  const isActive = selectedAvatar === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        s.avatarOption,
                        { borderColor: isActive ? C.primary : C.border },
                        isActive && { backgroundColor: C.inputBg },
                      ]}
                      onPress={() => {
                        setSelectedAvatar(item.id);
                        setAvatarPickerOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={item.source}
                        style={s.avatarOptionImage}
                        resizeMode="contain"
                      />
                      {isActive && (
                        <View style={[s.avatarCheckBadge, { backgroundColor: C.primary }]}>
                          <Check size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
              {selectedAvatar !== null && (
                <TouchableOpacity
                  style={[s.removeBtn, { borderColor: "#EF4444" }]}
                  onPress={() => {
                    setSelectedAvatar(null);
                    setAvatarPickerOpen(false);
                  }}
                >
                  <Text style={s.removeBtnText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* ── Appearance ───────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: C.subtext }]}>Appearance</Text>
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <TouchableOpacity
            style={s.dropdownTrigger}
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <View style={s.dropdownLeft}>
              <activeOption.icon size={18} color={C.primary} />
              <Text style={[s.dropdownValue, { color: C.text }]}>{activeOption.label}</Text>
            </View>
            <ChevronDown size={18} color={C.muted} />
          </TouchableOpacity>

          {/* Theme Dropdown Modal */}
          <Modal
            visible={dropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownOpen(false)}
          >
            <TouchableOpacity
              style={s.backdrop}
              activeOpacity={1}
              onPress={() => setDropdownOpen(false)}
            />
            <View style={[s.dropdownList, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.dropdownTitle, { color: C.subtext }]}>Choose Appearance</Text>
              {THEME_OPTIONS.map(({ label, value, icon: Icon }) => {
                const isActive = mode === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      s.dropdownItem,
                      { borderTopColor: C.border },
                      isActive && { backgroundColor: C.inputBg },
                    ]}
                    onPress={() => { setMode(value); setDropdownOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[
                      s.dropdownItemIcon,
                      { backgroundColor: isActive ? C.primary : C.inputBg },
                    ]}>
                      <Icon size={16} color={isActive ? "#fff" : C.muted} />
                    </View>
                    <Text style={[
                      s.dropdownItemText,
                      { color: C.text },
                      isActive && { color: C.primary, fontWeight: "700" },
                    ]}>
                      {label}
                    </Text>
                    {isActive && (
                      <Check size={16} color={C.primary} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Modal>
        </View>

        {/* ── Account ──────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: C.subtext }]}>Account</Text>
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                s.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.menuIconBox, { backgroundColor: C.inputBg }]}>
                <item.icon size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.menuLabel, { color: C.text }]}>{item.label}</Text>
                <Text style={[s.menuSub, { color: C.muted }]}>{item.sub}</Text>
              </View>
              <ChevronRight color={C.muted} size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── About ────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: C.subtext }]}>About</Text>
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: C.subtext }]}>Version</Text>
            <Text style={[s.infoVal, { color: C.text }]}>1.0.0</Text>
          </View>
          <View style={[s.infoRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
            <Text style={[s.infoLabel, { color: C.subtext }]}>School</Text>
            <Text style={[s.infoVal, { color: C.text }]}>PSD K–12</Text>
          </View>
          <View style={[s.infoRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
            <Text style={[s.infoLabel, { color: C.subtext }]}>System</Text>
            <Text style={[s.infoVal, { color: C.text }]}>SafeCheck SignSpeak</Text>
          </View>
        </View>

        {/* ── Logout ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: C.card, borderColor: "#EF4444" }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut color="#EF4444" size={20} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, paddingHorizontal: 20 },

  // Profile card
  profileCard:       { borderRadius: 24, padding: 24, alignItems: "center", marginTop: 16, marginBottom: 20, borderWidth: 1, gap: 6 },
  avatarWrap:        { position: "relative", marginBottom: 8 },
  avatar:            { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  avatarImage:       { width: 88, height: 88, borderRadius: 44 },
  avatarText:        { color: "#fff", fontWeight: "800", fontSize: 28 },
  editBadge:         { position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  changePhotoText:   { fontSize: 13, fontWeight: "600", marginTop: 4 },
  name:              { fontSize: 20, fontWeight: "800" },
  username:          { fontSize: 13 },
  roleBadge:         { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, marginTop: 4 },
  roleText:          { fontSize: 12, fontWeight: "600" },

  // Section label
  sectionLabel:      { fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },

  // Card
  card:              { borderRadius: 20, borderWidth: 1, marginBottom: 20, overflow: "hidden" },

  // Avatar Picker
  pickerWrapper:     { flex: 1, justifyContent: "flex-end" },
  pickerSheet:       { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  sheetHandle:       { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  pickerHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pickerTitle:       { fontSize: 20, fontWeight: "800" },
  pickerSub:         { fontSize: 13, marginTop: 2 },
  closeBtn:          { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarGrid:        { gap: 12 },
  avatarOption:      { flex: 1, aspectRatio: 1, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", padding: 8, position: "relative" },
  avatarOptionImage: { width: "100%", height: "100%", borderRadius: 14 },
  avatarCheckBadge:  { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  removeBtn:         { borderWidth: 1.5, borderRadius: 16, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  removeBtnText:     { color: "#EF4444", fontWeight: "700", fontSize: 14 },

  // Dropdown trigger
  dropdownTrigger:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  dropdownLeft:      { flexDirection: "row", alignItems: "center", gap: 10 },
  dropdownValue:     { fontSize: 15, fontWeight: "600" },

  // Modal
  backdrop:          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  dropdownList:      { position: "absolute", bottom: 120, left: 20, right: 20, borderRadius: 20, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12, overflow: "hidden" },
  dropdownTitle:     { fontSize: 12, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 12, letterSpacing: 0.5 },
  dropdownItem:      { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderTopWidth: 1 },
  dropdownItemIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dropdownItemText:  { fontSize: 15 },

  // Menu
  menuItem:          { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIconBox:       { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel:         { fontSize: 15, fontWeight: "600" },
  menuSub:           { fontSize: 12, marginTop: 1 },

  // Info
  infoRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel:         { fontSize: 13 },
  infoVal:           { fontSize: 13, fontWeight: "600" },

  // Logout
  logoutBtn:         { borderRadius: 20, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, gap: 10 },
  logoutText:        { color: "#EF4444", fontSize: 15, fontWeight: "700" },
});