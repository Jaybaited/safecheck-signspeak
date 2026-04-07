import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) {
    console.warn("Push notifications only work on physical devices");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission denied");
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Save token to backend — token auto-attached via api.ts interceptor
  await api.post("/notifications/register-token", { pushToken });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "SafeCheck Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#8B5CF6",
    });
  }
}
