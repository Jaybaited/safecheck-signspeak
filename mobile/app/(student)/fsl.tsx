import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Camera, Gamepad2, BookOpen, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48 - 12) / 2;

const MODES = [
  {
    icon: Camera,
    label: "Sign Detection",
    description: "Use your camera to detect FSL signs in real-time using AI",
    route: "/(student)/fsl-detection",
    image: require("../../assets/images/fsl-detect-card.png"),
    color: "#8B1A1A",
    lightColor: "#FEE2E2",
  },
  {
    icon: Gamepad2,
    label: "Sign Game",
    description: "Sign the letter shown on screen to score points",
    route: "/(student)/fsl-game",
    image: require("../../assets/images/fsl-game-card.jpg"),
    color: "#B45309",
    lightColor: "#FEF3C7",
  },
  {
    icon: BookOpen,
    label: "Learn Signs",
    description: "Browse all 26 FSL alphabet hand signs",
    route: "/(student)/fsl-learn",
    image: require("../../assets/images/quiz.jpg"),
    color: "#065F46",
    lightColor: "#D1FAE5",
  },
];

export default function FSLScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={[s.title, { color: C.text }]}>FSL Learning</Text>
          <Text style={[s.subtitle, { color: C.muted }]}>
            Choose a mode to get started
          </Text>
        </View>

        {/* ── Top Banner Card ── */}
        <TouchableOpacity
          style={[s.banner, { backgroundColor: "#8B1A1A" }]}
          onPress={() => router.push("/(student)/fsl-detection" as any)}
          activeOpacity={0.88}
        >
          <View style={s.bannerLeft}>
            <Text style={s.bannerTag}>✦ Featured</Text>
            <Text style={s.bannerTitle}>
              More Ways to{"\n"}Learn Sign Language
            </Text>
            <Text style={s.bannerSub}>
              Practice FSL anytime, anywhere — with games, AI detection, and guided lessons.
            </Text>
            <View style={s.bannerBtn}>
              <Text style={s.bannerBtnText}>Explore Now</Text>
              <ArrowRight size={14} color="#8B1A1A" />
            </View>
          </View>
          <Image
            source={require("../../assets/images/fsl-banner.png")}
            style={s.bannerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* ── Section Label ── */}
        <Text style={[s.sectionLabel, { color: C.text }]}>Learning Modes</Text>

        {/* ── Mode Cards Grid ── */}
        <View style={s.grid}>
          {MODES.map((mode, index) => (
            <TouchableOpacity
      key={index}
      style={[s.modeCard, {
        backgroundColor: C.card,
        borderColor: C.border,
        width: CARD_SIZE,   // ✅ all cards same size, no special case
      }]}
      onPress={() => router.push(mode.route as any)}
      activeOpacity={0.8}
    >
              {/* Illustration */}
              <View style={[s.modeImageWrap, { backgroundColor: mode.lightColor }]}>
                <Image
                  source={mode.image}
                  style={s.modeImage}
                  resizeMode="contain"
                />
                {/* Icon badge */}
                <View style={[s.modeBadge, { backgroundColor: mode.color }]}>
                  <mode.icon size={14} color="#fff" />
                </View>
              </View>

              {/* Text */}
              <View style={s.modeBody}>
                <Text style={[s.modeTitle, { color: C.text }]}>{mode.label}</Text>
                <Text style={[s.modeDesc, { color: C.muted }]} numberOfLines={3}>
                  {mode.description}
                </Text>
              </View>

              {/* Bottom CTA */}
              <View style={[s.modeCta, { borderTopColor: C.border }]}>
                <Text style={[s.modeCtaText, { color: mode.color }]}>Start</Text>
                <ArrowRight size={13} color={mode.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1 },

  // Header
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:          { fontSize: 24, fontWeight: "800" },
  subtitle:       { fontSize: 13, marginTop: 2 },

  // Banner
  banner:         {
    marginHorizontal: 20, marginBottom: 24,
    borderRadius: 24, padding: 22,
    flexDirection: "row", alignItems: "center",
    overflow: "hidden",
    shadowColor: "#8B1A1A", shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bannerLeft:     { flex: 1, gap: 8 },
  bannerTag:      { color: "#FECACA", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  bannerTitle:    { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 27 },
  bannerSub:      { color: "#FECACA", fontSize: 12, lineHeight: 18 },
  bannerBtn:      {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginTop: 4,
    backgroundColor: "#fff", paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  bannerBtnText:  { color: "#8B1A1A", fontWeight: "700", fontSize: 13 },
  bannerImage:    { width: 110, height: 110, marginLeft: 8 },

  // Section label
  sectionLabel:   { fontSize: 16, fontWeight: "700", paddingHorizontal: 20, marginBottom: 14 },

  // Grid
  grid:           {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 20, gap: 12,
  },
  modeCard:       {
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden",
  },
  modeImageWrap:  {
    width: "100%", height: 130,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  modeImage:      { width: "85%", height: "85%" },
  modeBadge:      {
    position: "absolute", bottom: 10, right: 10,
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  modeBody:       { padding: 12, gap: 4 },
  modeTitle:      { fontSize: 14, fontWeight: "800" },
  modeDesc:       { fontSize: 11, lineHeight: 16 },
  modeCta:        {
    flexDirection: "row", alignItems: "center",
    justifyContent: "flex-end", gap: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1,
  },
  modeCtaText:    { fontSize: 13, fontWeight: "700" },
});