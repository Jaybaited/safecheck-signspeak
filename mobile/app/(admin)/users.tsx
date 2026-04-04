import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, ScrollView,
  Animated, Easing, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { api } from "../../lib/api";
import {
  Users, GraduationCap, UserCheck, ShieldCheck,
  X, CreditCard, User, BookOpen, Hash,
} from "lucide-react-native";

const { height: SCREEN_H } = Dimensions.get("window");

interface UserItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string | null;
  gradeLevel: string | null;
  rfidCard?: string | null;
  parents?:  { parent:  { id: string; firstName: string; lastName: string; username: string } }[];
  children?: { student: { id: string; firstName: string; lastName: string; username: string; gradeLevel: string | null } }[];
}

const ROLE_FILTERS = ["ALL", "STUDENT", "TEACHER", "PARENT", "ADMIN"];

const ROLE_META: Record<string, { color: string; icon: any }> = {
  STUDENT: { color: "#00897B",  icon: GraduationCap },
  TEACHER: { color: "#10B981",  icon: UserCheck      },
  PARENT:  { color: "#F59E0B",  icon: Users          },
  ADMIN:   { color: "#EF4444",  icon: ShieldCheck    },
};

export default function UsersScreen() {
  const { token } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  // patch STUDENT to theme primary at runtime
  ROLE_META.STUDENT.color = C.primary;

  const [users, setUsers]               = useState<UserItem[]>([]);
  const [filtered, setFiltered]         = useState<UserItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]         = useState<UserItem | null>(null);
  const [sheetOpen, setSheetOpen]       = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const openSheet = (user: UserItem) => {
    setSelected(user);
    setSheetOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0, duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H, duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => { setSheetOpen(false); setSelected(null); });
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFiltered(res.data);
    } catch {
      setUsers([]); setFiltered([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, []);

  const applyFilter = (role: string) => {
    setActiveFilter(role);
    setFiltered(role === "ALL" ? users : users.filter((u) => u.role === role));
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <View style={[s.headerIconBadge, { backgroundColor: C.primary + "22" }]}>
          <Users size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: C.text }]}>Manage Users</Text>
          <Text style={[s.headerSub, { color: C.muted }]}>
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── Role Filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={s.filterRow}
      >
        {ROLE_FILTERS.map((role) => {
          const isActive = activeFilter === role;
          return (
            <TouchableOpacity
              key={role}
              style={[
                s.filterBtn,
                { backgroundColor: C.card, borderColor: C.border },
                isActive && { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
              ]}
              onPress={() => applyFilter(role)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterText, { color: isActive ? "#fff" : C.muted }]}>
                {role}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── User List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={[s.emptyRing, { borderColor: C.border }]}>
              <Users size={34} color={C.muted} />
            </View>
            <Text style={[s.emptyTitle, { color: C.text }]}>No users found</Text>
            <Text style={[s.emptySub, { color: C.muted }]}>Try a different filter</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = ROLE_META[item.role] ?? ROLE_META.ADMIN;
          const Icon = meta.icon;
          return (
            <TouchableOpacity
              style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => openSheet(item)}
              activeOpacity={0.75}
            >
              <View style={[s.avatar, { backgroundColor: meta.color + "22" }]}>
                <Text style={[s.avatarText, { color: meta.color }]}>
                  {item.firstName[0]}{item.lastName[0]}
                </Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardName, { color: C.text }]}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={[s.cardUsername, { color: C.muted }]}>@{item.username}</Text>
                {item.gradeLevel && (
                  <Text style={[s.cardGrade, { color: C.muted }]}>
                    {item.gradeLevel.replace(/_/g, " ")}
                  </Text>
                )}
              </View>
              <View style={[s.roleBadge, { backgroundColor: meta.color + "18", borderColor: meta.color + "44" }]}>
                <Icon size={10} color={meta.color} />
                <Text style={[s.roleText, { color: meta.color }]}>{item.role}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Detail Bottom Sheet ── */}
      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={closeSheet}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeSheet} />
        <Animated.View
          style={[
            s.sheet,
            { backgroundColor: C.card, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {selected && (() => {
            const meta = ROLE_META[selected.role] ?? ROLE_META.ADMIN;
            const Icon = meta.icon;
            return (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={[s.sheetHandle, { backgroundColor: C.border }]} />

                {/* Sheet Header */}
                <View style={s.sheetTop}>
                  <View style={[s.sheetAvatar, { backgroundColor: meta.color + "22" }]}>
                    <Text style={[s.sheetAvatarText, { color: meta.color }]}>
                      {selected.firstName[0]}{selected.lastName[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sheetName, { color: C.text }]}>
                      {selected.firstName} {selected.lastName}
                    </Text>
                    <Text style={[s.sheetUsername, { color: C.muted }]}>
                      @{selected.username}
                    </Text>
                    <View style={[s.sheetRoleBadge, { backgroundColor: meta.color + "22" }]}>
                      <Icon size={11} color={meta.color} />
                      <Text style={[s.sheetRoleText, { color: meta.color }]}>{selected.role}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[s.closeBtn, { backgroundColor: C.background }]}
                    onPress={closeSheet}
                  >
                    <X size={18} color={C.muted} />
                  </TouchableOpacity>
                </View>

                {/* Detail Rows */}
                <View style={[s.detailBlock, { backgroundColor: C.background, borderColor: C.border }]}>
                  <DetailRow
                    icon={<Hash size={14} color={C.muted} />}
                    label="User ID"
                    value={selected.id.slice(0, 16) + "…"}
                    C={C} last={false}
                  />
                  <DetailRow
                    icon={<User size={14} color={C.muted} />}
                    label="Username"
                    value={`@${selected.username}`}
                    C={C} last={false}
                  />
                  {selected.email && (
                    <DetailRow
                      icon={<BookOpen size={14} color={C.muted} />}
                      label="Email"
                      value={selected.email}
                      C={C} last={false}
                    />
                  )}

                  {/* STUDENT */}
                  {selected.role === "STUDENT" && (
                    <>
                      {selected.gradeLevel && (
                        <DetailRow
                          icon={<GraduationCap size={14} color={C.muted} />}
                          label="Grade Level"
                          value={selected.gradeLevel.replace(/_/g, " ")}
                          C={C} last={false}
                        />
                      )}
                      <DetailRow
                        icon={<CreditCard size={14} color={C.muted} />}
                        label="RFID Card"
                        value={selected.rfidCard ?? "Not assigned"}
                        C={C}
                        last={!selected.parents?.length}
                      />
                      {selected.parents?.map((p, i) => (
                        <DetailRow
                          key={i}
                          icon={<Users size={14} color={C.muted} />}
                          label={`Parent${(selected.parents!.length > 1) ? ` ${i + 1}` : ""}`}
                          value={`${p.parent.firstName} ${p.parent.lastName} (@${p.parent.username})`}
                          C={C}
                          last={i === selected.parents!.length - 1}
                        />
                      ))}
                    </>
                  )}

                  {/* PARENT */}
                  {selected.role === "PARENT" && (
                    <>
                      {selected.children?.length ? (
                        selected.children.map((c, i) => (
                          <DetailRow
                            key={i}
                            icon={<GraduationCap size={14} color={C.muted} />}
                            label={`Child${(selected.children!.length > 1) ? ` ${i + 1}` : ""}`}
                            value={`${c.student.firstName} ${c.student.lastName}${c.student.gradeLevel ? " · " + c.student.gradeLevel.replace(/_/g, " ") : ""}`}
                            C={C}
                            last={i === selected.children!.length - 1}
                          />
                        ))
                      ) : (
                        <DetailRow
                          icon={<GraduationCap size={14} color={C.muted} />}
                          label="Children"
                          value="No children linked"
                          C={C} last
                        />
                      )}
                    </>
                  )}

                  {/* TEACHER / ADMIN */}
                  {(selected.role === "TEACHER" || selected.role === "ADMIN") && (
                    <DetailRow
                      icon={<ShieldCheck size={14} color={C.muted} />}
                      label="Role"
                      value={selected.role}
                      C={C} last
                    />
                  )}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            );
          })()}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Reusable detail row ──────────────────────────────────────────────────────
function DetailRow({
  icon, label, value, C, last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  C: any;
  last: boolean;
}) {
  return (
    <View style={[s.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <View style={s.detailLeft}>
        {icon}
        <Text style={[s.detailLabel, { color: C.muted }]}>{label}</Text>
      </View>
      <Text style={[s.detailValue, { color: C.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerIconBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 20, fontWeight: "700" },
  headerSub:       { fontSize: 12, marginTop: 1 },

  // Filter
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "center" },
  filterBtn: {
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: { fontSize: 11, fontWeight: "700" },

  // List
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  // Card
  card:         { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:       { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontSize: 15, fontWeight: "800" },
  cardInfo:     { flex: 1, gap: 2 },
  cardName:     { fontSize: 14, fontWeight: "700" },
  cardUsername: { fontSize: 12 },
  cardGrade:    { fontSize: 11 },
  roleBadge:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  roleText:     { fontSize: 10, fontWeight: "700" },

  // Empty
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyRing:  { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub:   { fontSize: 13 },

  // Sheet
  backdrop:        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#00000066" },
  sheet:           { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 0, maxHeight: SCREEN_H * 0.82 },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTop:        { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  sheetAvatar:     { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  sheetAvatarText: { fontSize: 20, fontWeight: "800" },
  sheetName:       { fontSize: 18, fontWeight: "800" },
  sheetUsername:   { fontSize: 13, marginTop: 2 },
  sheetRoleBadge:  { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 6 },
  sheetRoleText:   { fontSize: 11, fontWeight: "700" },
  closeBtn:        { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  // Detail block
  detailBlock:  { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  detailRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  detailLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel:  { fontSize: 13 },
  detailValue:  { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
});