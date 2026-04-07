import { Tabs } from "expo-router";
import { Home, CalendarDays, HandMetal, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.tabBorder,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 65 + insets.bottom,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="fsl"
        options={{
          title: "FSL Learning",
          tabBarIcon: ({ color, size }) => (
            <HandMetal color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      {/* Hidden from bottom nav */}
      <Tabs.Screen name="fsl-detection" options={{ href: null }} />
      <Tabs.Screen name="fsl-game"      options={{ href: null }} />
      <Tabs.Screen name="fsl-learn"     options={{ href: null }} />
    </Tabs>
  );
}