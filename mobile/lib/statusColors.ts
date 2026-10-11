// Status colors for assessment states (theme.ts has none).
import type { LevelState } from "./assessments-api";

export interface StatusColor {
  fg: string; // text / icon
  bg: string; // badge background
}

type Theme = "light" | "dark";

const GREEN = { light: { fg: "#15803D", bg: "#DCFCE7" }, dark: { fg: "#86EFAC", bg: "#14532D" } };
const RED = { light: { fg: "#B91C1C", bg: "#FEE2E2" }, dark: { fg: "#FCA5A5", bg: "#7F1D1D" } };
const AMBER = { light: { fg: "#B45309", bg: "#FEF3C7" }, dark: { fg: "#FCD34D", bg: "#78350F" } };
const GRAY = { light: { fg: "#6B7280", bg: "#F3F4F6" }, dark: { fg: "#9CA3AF", bg: "#374151" } };

export const getStatusColor = (state: LevelState, theme: Theme): StatusColor => {
  switch (state) {
    case "PASSED":
      return GREEN[theme];
    case "FAILED":
      return RED[theme];
    case "AWAITING_REVIEW":
    case "IN_PROGRESS":
      return AMBER[theme];
    case "AVAILABLE":
    case "LOCKED":
    default:
      return GRAY[theme];
  }
};

export const getResultColor = (ok: boolean, theme: Theme): StatusColor =>
  ok ? GREEN[theme] : RED[theme];