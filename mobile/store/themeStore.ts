import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Appearance, ColorSchemeName } from "react-native";

type ThemeMode = "light" | "dark" | "device";

interface ThemeStore {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => Promise<void>;
  loadMode: () => Promise<void>;
}

const getResolved = (mode: ThemeMode): "light" | "dark" => {
  if (mode === "device") {
    // ✅ Add ?? "light" fallback — getColorScheme() can return null
    //    during app boot before the system theme is ready
    return (Appearance.getColorScheme() ?? "light") === "dark" ? "dark" : "light";
  }
  return mode;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "device",
  // ✅ Same fix here — null-safe fallback at initialization
  resolvedTheme: (Appearance.getColorScheme() ?? "light") === "dark" ? "dark" : "light",

  setMode: async (mode) => {
    await SecureStore.setItemAsync("theme_mode", mode);
    set({ mode, resolvedTheme: getResolved(mode) });
  },

  loadMode: async () => {
    const saved = await SecureStore.getItemAsync("theme_mode");
    const mode = (saved as ThemeMode) ?? "device";
    // ✅ getResolved now has the null-safe fallback, so this is fine
    set({ mode, resolvedTheme: getResolved(mode) });
  },
}));