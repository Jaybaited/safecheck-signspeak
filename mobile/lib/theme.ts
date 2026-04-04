export const lightColors = {
  background:   "#FDF4F4",
  card:         "#FFFFFF",
  text:         "#1A0505",
  subtext:      "#7A4040",
  muted:        "#C4A0A0",
  border:       "#FEE2E2",
  primary:      "#8B1A1A",
  inputBg:      "#FDF4F4",
  inputBorder:  "#E8C4C4",
  tabBar:       "#FFFFFF",
  tabBorder:    "#FEE2E2",
  statusBar:    "dark" as const,
};

export const darkColors = {
  background:   "#1A0505",
  card:         "#2D0A0A",
  text:         "#FDF4F4",
  subtext:      "#FECACA",
  muted:        "#7A4040",
  border:       "#4A1A1A",
  primary:      "#C0392B",
  inputBg:      "#2D0A0A",
  inputBorder:  "#4A1A1A",
  tabBar:       "#2D0A0A",
  tabBorder:    "#4A1A1A",
  statusBar:    "light" as const,
};

export type ThemeColors = typeof lightColors;

export const getColors = (theme: "light" | "dark"): ThemeColors =>
  theme === "dark" ? darkColors : lightColors;