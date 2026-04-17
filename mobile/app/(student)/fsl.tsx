import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Dimensions, Animated,
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
    image: require("../../assets/images/fsl-game-card.png"),
    color: "#B45309",
    lightColor: "#FEF3C7",
  },
  {
    icon: BookOpen,
    label: "Learn Signs",
    description: "Browse all 26 FSL alphabet hand signs",
    route: "/(student)/fsl-learn",
    image: require("../../assets/images/quiz.png"),
    color: "#065F46",
    lightColor: "#D1FAE5",
  },
];

export default function FSLScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  // ── Entrance animations ──
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const bannerAnim  = useRef(new Animated.Value(0)).current;
  const cardAnims   = useRef(MODES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      // Header fades in first
      Animated.timing(headerAnim, {
        toValue: 1, duration: 320, useNativeDriver: true,
      }),
      // Banner slides up
      Animated.timing(bannerAnim, {
        toValue: 1, duration: 360, useNativeDriver: true,
      }),
      // Cards stagger in
      Animated.stagger(80, cardAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        })
      )),
    ]).start();
  }, []);

  const headerStyle = {
    opacity: headerAnim,
    transform: [{
      translateY: headerAnim.interpolate({
        inputRange: [0, 1], outputRange: [12, 0],
      }),
    }],
  };

  const bannerStyle = {
    opacity: bannerAnim,
    transform: [{
      translateY: bannerAnim.interpolate({
        inputRange: [0, 1], outputRange: [20, 0],
      }),
    }],
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
<Animated.View style={[s.header, headerStyle]}>
  <Text style={[s.title, { color: C.primary }]}>  {/* ← C.text → C.primary */}
    FSL Learning
  </Text>
  <Text style={[s.subtitle, { color: C.textSecondary }]}>
    Choose a mode to get started
  </Text>
</Animated.View>

        {/* ── Top Banner Card ── */}
        <Animated.View style={bannerStyle}>
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
        </Animated.View>

        {/* ── Section Label ── */}
        <Animated.Text style={[s.sectionLabel, { color: C.text }, {
          opacity: bannerAnim,
          transform: [{
            translateY: bannerAnim.interpolate({
              inputRange: [0, 1], outputRange: [10, 0],
            }),
          }],
        }]}>
          Learning Modes
        </Animated.Text>

       {/* ── Mode Cards Grid ── */}
<View style={s.grid}>
  {MODES.map((mode, index) => {
    const cardStyle = {
      opacity: cardAnims[index],
      transform: [{
        translateY: cardAnims[index].interpolate({
          inputRange: [0, 1], outputRange: [24, 0],
        }),
      }],
    };
    const Icon = mode.icon;
    return (
      <Animated.View key={mode.label} style={[{ width: "100%" }, cardStyle]}>
        <TouchableOpacity
          style={[s.modeCard, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => router.push(mode.route as any)}
          activeOpacity={0.8}
        >
          {/* LEFT — white image area */}
          <View style={s.modeImageWrap}>
            <Image
              source={mode.image}
              style={s.modeImage}
              resizeMode="contain"
            />
          </View>

          {/* RIGHT — text content */}
          <View style={s.modeBody}>
            {/* Icon badge + title row */}
            <View style={s.modeTitleRow}>
              <View style={[s.modeBadge, { backgroundColor: mode.lightColor }]}>
                <Icon size={14} color={mode.color} />
              </View>
              <Text style={[s.modeTitle, { color: C.text }]}>{mode.label}</Text>
            </View>
            <Text style={[s.modeDesc, { color: C.textSecondary }]}>
              {mode.description}
            </Text>
            {/* CTA row */}
            <View style={s.modeCta}>
              <Text style={[s.modeCtaText, { color: mode.color }]}>Start</Text>
              <ArrowRight size={13} color={mode.color} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  })}
</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:          { fontSize: 24, fontWeight: "800" },
  subtitle:       { fontSize: 13, marginTop: 2 },
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
  sectionLabel:   { fontSize: 16, fontWeight: "700", paddingHorizontal: 20, marginBottom: 14 },
  grid: {
  flexDirection: "column",       // ← stacked vertically
  paddingHorizontal: 20,
  gap: 12,
},
modeCard: {
  borderRadius: 20,
  borderWidth: 1,
  overflow: "hidden",
  width: "100%",
  flexDirection: "row",          // ← horizontal rectangle
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},
modeImageWrap: {
  width: 110,                    // ← fixed width left column
  height: 110,
  backgroundColor: "#FFFFFF",    // ← always white
  alignItems: "center",
  justifyContent: "center",
  borderRightWidth: 1,
  borderRightColor: "#EEEEEE",
},
modeImage: {
  width: "80%",
  height: "80%",
},
modeBody: {
  flex: 1,
  padding: 14,
  gap: 6,
},
modeTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
modeBadge: {
  width: 28,
  height: 28,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
},
modeTitle: {
  fontSize: 15,
  fontWeight: "800",
},
modeDesc: {
  fontSize: 12,
  lineHeight: 17,
},
modeCta: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  marginTop: 4,
},
modeCtaText: {
  fontSize: 13,
  fontWeight: "700",
},
});