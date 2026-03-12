import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="/(student)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(parent)"/>
    </Stack>
  );
}
