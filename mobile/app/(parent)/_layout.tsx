import { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export default function ParentLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "RFID_ENTRY" || data?.type === "RFID_EXIT") {
          router.push("/(parent)/notifications");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
       tabBarStyle: {
        backgroundColor: "#0F0F23",
        borderTopColor: "#1E1E3A",
        borderTopWidth: 1,
        height: Platform.OS === "android" ? 60 + insets.bottom : 56 + insets.bottom,
        paddingBottom: Platform.OS === "android" ? insets.bottom + 8 : insets.bottom + 4,
        paddingTop: 8,
    },
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
