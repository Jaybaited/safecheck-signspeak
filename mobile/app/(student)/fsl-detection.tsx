import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { ArrowLeft, CheckCircle, Scan } from "lucide-react-native";
import { FSLCamera } from "../../components/camera/FSLCamera";
import { capturePhoto } from "../../components/camera/capturePhoto";

const MOBILE_ML_URL = "http://192.168.1.24:8001";

const FSL_LETTERS = [
  "A","B","C","D","E","F","G","H","I",
  "K","L","M","N","O","P","Q","R","S",
  "T","U","V","W","X","Y",
];

const TIPS: Record<string, string> = {
  A: "Make a fist with your thumb resting on the side.",
  B: "Hold four fingers straight up, thumb tucked across palm.",
  C: 'Curve your hand into a "C" shape.',
  D: "Point index finger up, other fingers and thumb form a circle.",
  E: "Curl all fingers down, thumb tucked under.",
  F: "Touch index finger to thumb, other fingers spread.",
  G: "Point index finger sideways, thumb parallel.",
  H: "Two fingers pointing sideways, parallel.",
  I: "Raise your pinky finger only.",
  K: "Index and middle fingers up in a V, thumb between them.",
  L: "Index finger points up, thumb points sideways — L shape.",
  M: "Three fingers folded over thumb.",
  N: "Two fingers folded over thumb.",
  O: "All fingers and thumb form a circle.",
  P: "Like K but pointing downward.",
  Q: "Like G but pointing downward.",
  R: "Cross index and middle fingers.",
  S: "Make a fist with thumb over fingers.",
  T: "Thumb between index and middle fingers.",
  U: "Index and middle fingers together, pointing up.",
  V: "Index and middle fingers spread in a V.",
  W: "Three fingers spread out.",
  X: "Hook index finger into a curve.",
  Y: "Thumb and pinky extended, other fingers curled.",
};

export default function FSLDetectionScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);
  const cameraRef = useRef<any>(null);

  const [selectedLetter, setSelected] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [lastConfidence, setLastConf] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [liveResult, setLiveResult] = useState<{
    sign: string | null; confidence: number; detected: boolean;
  } | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedLetterRef = useRef<string | null>(null);
  const isBusyRef = useRef(false);
  const isActiveRef = useRef(false);

  const stopDetection = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isBusyRef.current = false;
  }, []);

  const captureAndCheck = async () => {
    if (!isActiveRef.current || !cameraRef.current || !selectedLetterRef.current || isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      const base64 = await capturePhoto(cameraRef);
      if (!base64 || !isActiveRef.current) return;

      const response = await fetch(`${MOBILE_ML_URL}/predict-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();

      if (!isActiveRef.current) return;

      setLiveResult(data);

      if (
        data.detected &&
        data.sign === selectedLetterRef.current &&
        data.confidence >= 0.7
      ) {
        stopDetection();
        setLastConf(data.confidence);
        setIsCorrect(true);
        setLiveResult(null);
        setCompleted((prev) => new Set([...prev, selectedLetterRef.current!]));
        return;
      }
    } catch (err) {
      console.error("Capture error:", err);
    } finally {
      isBusyRef.current = false;
    }

    if (isActiveRef.current) {
      timeoutRef.current = setTimeout(captureAndCheck, 600);
    }
  };

  const startDetection = useCallback(() => {
    isActiveRef.current = true;
    setIsActive(true);
    isBusyRef.current = false;
    timeoutRef.current = setTimeout(captureAndCheck, 200);
  }, []);

  const selectLetter = (letter: string) => {
    stopDetection();
    setSelected(letter);
    selectedLetterRef.current = letter;
    setLastConf(null);
    setIsCorrect(false);
    setLiveResult(null);
    setTimeout(() => startDetection(), 600);
  };

  const goToNext = () => {
    if (!selectedLetterRef.current) return;
    const idx = FSL_LETTERS.indexOf(selectedLetterRef.current);
    const next = FSL_LETTERS[idx + 1];
    if (next) selectLetter(next);
  };

  const progressPct = Math.round((completed.size / FSL_LETTERS.length) * 100);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { borderColor: C.border, backgroundColor: C.card }]}
          onPress={() => { stopDetection(); router.replace("/(student)/fsl" as any); }}
        >
          <ArrowLeft size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.text }]}>FSL Practice</Text>
        <View style={[s.countBadge, { backgroundColor: C.primary + "22", borderColor: C.primary + "44" }]}>
          <Text style={[s.countBadgeText, { color: C.primary }]}>
            {completed.size}/{FSL_LETTERS.length}
          </Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={s.progressRow}>
        <View style={[s.progressBg, { backgroundColor: C.border }]}>
          <View style={[s.progressFill, { width: `${progressPct}%` as any, backgroundColor: C.primary }]} />
        </View>
        <Text style={[s.progressPct, { color: C.primary }]}>{progressPct}%</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Letter Selector ── */}
        <Text style={[s.sectionLabel, { color: C.muted }]}>Choose a Letter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.letterRow}>
          {FSL_LETTERS.map((letter) => {
            const isDone = completed.has(letter);
            const isSel = selectedLetter === letter;
            return (
              <TouchableOpacity
                key={letter}
                style={[s.letterBtn, {
                  backgroundColor: isDone ? C.primary : isSel ? C.primary + "22" : C.card,
                  borderColor: isDone ? C.primary : isSel ? C.primary : C.border,
                }]}
                onPress={() => selectLetter(letter)}
              >
                <Text style={[s.letterBtnText, { color: isDone ? "#fff" : isSel ? C.primary : C.text }]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedLetter ? (
          <>
            {/* ── Tip Card ── */}
            <View style={[s.tipCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={[s.tipIcon, { backgroundColor: C.primary }]}>
                <Text style={s.tipIconText}>{selectedLetter}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.tipTitle, { color: C.text }]}>How to sign "{selectedLetter}"</Text>
                <Text style={[s.tipDesc, { color: C.muted }]}>{TIPS[selectedLetter]}</Text>
              </View>
            </View>

            {/* ── Camera ── */}
            <View style={[s.cameraWrap, { borderColor: isCorrect ? "#10B981" : C.border }]}>
              <FSLCamera ref={cameraRef} />

              <View style={[s.frameGuide, { borderColor: C.primary + "88" }]} />

              {liveResult?.detected && !isCorrect && (
                <View style={[s.camBadge, { top: 12, left: 12, backgroundColor: C.primary }]}>
                  <Text style={s.camBadgeText}>Sign: {liveResult.sign}</Text>
                </View>
              )}
              {liveResult?.detected && !isCorrect && (
                <View style={[s.camBadge, { bottom: 12, right: 12, backgroundColor: "#10B981" }]}>
                  <Text style={s.camBadgeText}>● Hand Detected</Text>
                </View>
              )}
              {isActive && !isCorrect && !liveResult?.detected && (
                <View style={[s.camBadge, { bottom: 12, right: 12, backgroundColor: "#6B7280" }]}>
                  <Text style={s.camBadgeText}>🔍 Scanning...</Text>
                </View>
              )}
              {isCorrect && (
                <View style={s.correctOverlay}>
                  <Text style={s.correctEmoji}>✅</Text>
                  <Text style={s.correctText}>Correct!</Text>
                </View>
              )}
            </View>

            {/* ── Live Result Card ── */}
            {liveResult?.detected && !isCorrect && (
              <View style={[s.liveCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={s.liveRow}>
                  <Text style={[s.liveSignBig, { color: C.text }]}>{liveResult.sign}</Text>
                  <View style={[s.liveDivider, { backgroundColor: C.border }]} />
                  <View style={s.liveConfCol}>
                    <Text style={[s.liveConfLabel, { color: C.muted }]}>Confidence</Text>
                    <Text style={[s.liveConf, { color: liveResult.confidence >= 0.7 ? "#10B981" : "#F59E0B" }]}>
                      {(liveResult.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={[s.liveDivider, { backgroundColor: C.border }]} />
                  <View style={s.liveConfCol}>
                    <Text style={[s.liveConfLabel, { color: C.muted }]}>Target</Text>
                    <Text style={[s.liveConf, { color: C.primary }]}>{selectedLetter}</Text>
                  </View>
                </View>
                <Text style={[s.liveHint, { color: C.muted }]}>Keep trying! Match the target letter above.</Text>
              </View>
            )}

            {/* ── Success Card ── */}
            {isCorrect && lastConfidence !== null && (
              <View style={s.successCard}>
                <CheckCircle size={32} color="#10B981" />
                <Text style={s.successTitle}>Great job! You signed "{selectedLetter}" correctly!</Text>
                <Text style={s.successConf}>Confidence: {(lastConfidence * 100).toFixed(1)}%</Text>
                {FSL_LETTERS.indexOf(selectedLetter) < FSL_LETTERS.length - 1 && (
                  <TouchableOpacity style={s.nextBtn} onPress={goToNext}>
                    <Text style={s.nextBtnText}>Next Letter →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40 }}>👆</Text>
            <Text style={[s.emptyText, { color: C.muted }]}>
              Select a letter above to start practicing
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  permIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  permTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  permSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  permBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, marginTop: 8 },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  countBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  countBadgeText: { fontWeight: "700", fontSize: 13 },
  progressRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  progressBg: { flex: 1, borderRadius: 99, height: 8 },
  progressFill: { height: 8, borderRadius: 99 },
  progressPct: { fontWeight: "700", fontSize: 13 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  letterRow: { marginBottom: 16 },
  letterBtn: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1 },
  letterBtnText: { fontWeight: "700", fontSize: 14 },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1 },
  tipIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tipIconText: { color: "#fff", fontWeight: "900", fontSize: 22 },
  tipTitle: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  tipDesc: { fontSize: 12, lineHeight: 18 },
  cameraWrap: { borderRadius: 20, overflow: "hidden", height: 300, marginBottom: 16, borderWidth: 2, position: "relative" },
  camera: { flex: 1 },
  frameGuide: { position: "absolute", top: "10%", left: "10%", width: "80%", height: "80%", borderWidth: 2, borderRadius: 14 },
  camBadge: { position: "absolute", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  camBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  correctOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(16,185,129,0.6)", alignItems: "center", justifyContent: "center" },
  correctEmoji: { fontSize: 48 },
  correctText: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },
  liveCard: { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 10 },
  liveSignBig: { fontSize: 48, fontWeight: "900" },
  liveDivider: { width: 1, height: 40 },
  liveConfCol: { alignItems: "center", gap: 4 },
  liveConfLabel: { fontSize: 11 },
  liveConf: { fontSize: 22, fontWeight: "800" },
  liveHint: { fontSize: 12, textAlign: "center" },
  successCard: { backgroundColor: "#D1FAE5", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#10B981", marginBottom: 16, gap: 6 },
  successTitle: { color: "#065F46", fontWeight: "700", fontSize: 15, textAlign: "center" },
  successConf: { color: "#059669", fontSize: 13 },
  nextBtn: { backgroundColor: "#10B981", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, marginTop: 8 },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});