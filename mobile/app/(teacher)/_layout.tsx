import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard, ClipboardList, BookOpen, User,
} from "lucide-react-native";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";

export default function TeacherLayout() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 65 + insets.bottom,
        },
        tabBarActiveTintColor: "#8B1A1A",
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="fsl"
        options={{
          title: "FSL Progress",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />

      {/* Hidden from tab bar — accessible via router.push from dashboard & profile */}
      <Tabs.Screen
        name="announcements"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}