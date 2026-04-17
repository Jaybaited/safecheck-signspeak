// lib/theme.ts

export const lightColors = {
  background:    "#F5F5F7",   // ← neutral off-white (no red tint)
  card:          "#FFFFFF",
  text:          "#1A0505",
  subtext:       "#7A4040",
  textSecondary: "#7A4040",
  muted:         "#C4A0A0",
  border:        "#EEEEEE",   // ← neutral border
  primary:       "#8B1A1A",
  inputBg:       "#FFFFFF",
  inputBorder:   "#E0E0E0",
  tabBar:        "#FFFFFF",
  tabBorder:     "#EEEEEE",
  statusBar:     "dark" as const,
};
export const darkColors = {
  background:    "#1A0505",
  card:          "#2D0A0A",
  text:          "#FDF4F4",
  subtext:       "#FECACA",
  textSecondary: "#FECACA",  // ← fixed (was using invalid isDark variable)
  muted:         "#7A4040",
  border:        "#4A1A1A",
  primary:       "#C0392B",
  inputBg:       "#2D0A0A",
  inputBorder:   "#4A1A1A",
  tabBar:        "#2D0A0A",
  tabBorder:     "#4A1A1A",
  statusBar:     "light" as const,
};

export type ThemeColors = typeof lightColors;

export const getColors = (theme: "light" | "dark"): ThemeColors =>
  theme === "dark" ? darkColors : lightColors;