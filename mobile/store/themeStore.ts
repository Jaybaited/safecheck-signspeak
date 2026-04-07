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
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return mode;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "device",
  resolvedTheme: getResolved("device"),

  setMode: async (mode) => {
    await SecureStore.setItemAsync("theme_mode", mode);
    set({ mode, resolvedTheme: getResolved(mode) });
  },

  loadMode: async () => {
    const saved = await SecureStore.getItemAsync("theme_mode");
    const mode = (saved as ThemeMode) ?? "device";
    set({ mode, resolvedTheme: getResolved(mode) });
  },
}));