import { Stack } from "expo-router";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const { loadMode, setMode, mode } = useThemeStore();

  useEffect(() => {
    loadMode();
    const sub = Appearance.addChangeListener(() => {
      if (mode === "device") setMode("device");
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(teacher)" /> 
    </Stack>
  );
}