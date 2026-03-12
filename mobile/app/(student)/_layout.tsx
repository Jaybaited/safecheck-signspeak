import { Tabs } from "expo-router";
import { Home, CalendarDays, HandMetal, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F0F23",
          borderTopColor: "#1E1E3A",
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 65 + insets.bottom,
        },
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#6B7280",
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
    </Tabs>
  );
}
