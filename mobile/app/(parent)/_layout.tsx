import { useEffect } from "react";
import { Tabs } from "expo-router";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ✅ Create notification channel once (safe to call multiple times)
async function createNotificationChannel() {
  await notifee.createChannel({
    id: "safecheck",
    name: "SafeCheck Alerts",
    importance: AndroidImportance.HIGH,
  });
}

export default function ParentLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user?.id || !token) return;

    const messaging = getMessaging();

    const registerFCM = async () => {
      try {
        // ✅ Create Android notification channel
        await createNotificationChannel();

        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn("[FCM] Permission not granted");
          return;
        }

        const fcmToken = await getToken(messaging);
        if (fcmToken) {
          await api.patch("/users/me/fcm-token", { fcmToken });
          console.log("[FCM] Token saved:", fcmToken);
        }
      } catch (err) {
        console.warn("[FCM] Failed to get/save token:", err);
      }
    };

    registerFCM();

    // ✅ Foreground: show heads-up banner via notifee
    const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
      console.log("[FCM] Foreground message:", remoteMessage.notification);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? "SafeCheck",
        body: remoteMessage.notification?.body ?? "",
        android: {
          channelId: "safecheck",
          importance: AndroidImportance.HIGH,
          pressAction: { id: "default" },
          smallIcon: "ic_launcher", // must exist in your android res folder
        },
      });
    });

    // ✅ Background: notification tapped → go to notifications tab
    const unsubscribeOpened = onNotificationOpenedApp(
      messaging,
      (remoteMessage) => {
        const type = remoteMessage.data?.type;
        if (type === "RFID_ENTRY" || type === "RFID_EXIT") {
          router.push("/(parent)/notifications");
        }
      }
    );

    // ✅ Notifee foreground tap → go to notifications tab
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      const { EventType } = require("@notifee/react-native");
      if (type === EventType.PRESS) {
        router.push("/(parent)/notifications");
      }
    });

    // ✅ Quit state: notification tapped
    getInitialNotification(messaging).then((remoteMessage) => {
      if (!remoteMessage) return;
      const type = remoteMessage.data?.type;
      if (type === "RFID_ENTRY" || type === "RFID_EXIT") {
        router.push("/(parent)/notifications");
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeNotifee();
    };
  }, [user?.id, token]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: Platform.OS === "android"
            ? 60 + insets.bottom
            : 56 + insets.bottom,
          paddingBottom: Platform.OS === "android"
            ? insets.bottom + 8
            : insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
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