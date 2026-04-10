import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import { ArrowLeft, CheckCircle, Scan } from "lucide-react-native";

// ← UPDATE THIS IP to match your PC's IPv4 (run `ipconfig` in PowerShell to check)
const MOBILE_ML_URL = "http://192.168.1.30:8001";

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
  const router                          = useRouter();
  const { resolvedTheme }               = useThemeStore();
  const C                               = getColors(resolvedTheme);
  const cameraRef                       = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedLetter, setSelected]   = useState<string | null>(null);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [lastConfidence, setLastConf]   = useState<number | null>(null);
  const [isCorrect, setIsCorrect]       = useState(false);
  const [isActive, setIsActive]         = useState(false);
  const [connectionError, setConnectionError] = useState(false); // ← ADDED
  const [liveResult, setLiveResult]     = useState<{
    sign: string | null; confidence: number; detected: boolean;
  } | null>(null);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedLetterRef = useRef<string | null>(null);

  const stopDetection = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startDetection = () => {
    setIsActive(true);
    setConnectionError(false); // ← ADDED: clear error on new start
    intervalRef.current = setInterval(async () => {
      await captureAndCheck();
    }, 1500);
  };

  const selectLetter = (letter: string) => {
    stopDetection();
    setSelected(letter);
    selectedLetterRef.current = letter;
    setLastConf(null);
    setIsCorrect(false);
    setLiveResult(null);
    setConnectionError(false); // ← ADDED
    setTimeout(() => startDetection(), 500);
  };

  const captureAndCheck = async () => {
    if (!cameraRef.current || !selectedLetterRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true, quality: 0.4, skipProcessing: true,
      });
      if (!photo?.base64) return;
      const response = await fetch(`${MOBILE_ML_URL}/predict-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.base64 }),
      });
      const data = await response.json();
      setConnectionError(false); // ← ADDED: clear error on success
      setLiveResult(data);
      if (data.detected && data.sign === selectedLetterRef.current && data.confidence >= 0.7) {
        stopDetection();
        setLastConf(data.confidence);
        setIsCorrect(true);
        setLiveResult(null);
        setCompleted((prev) => new Set([...prev, selectedLetterRef.current!]));
      }
    } catch (err) {
      console.error(err);
      setConnectionError(true); // ← ADDED: show connection error
      stopDetection();           // ← ADDED: stop spamming failed requests
    }
  };

  const goToNext = () => {
    if (!selectedLetterRef.current) return;
    const idx  = FSL_LETTERS.indexOf(selectedLetterRef.current);
    const next = FSL_LETTERS[idx + 1];
    if (next) selectLetter(next);
  };

  const progressPct = Math.round((completed.size / FSL_LETTERS.length) * 100);

  if (!permission) return <View style={[s.container, { backgroundColor: C.background }]} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <View style={s.centered}>
          <View style={[s.permIcon, { backgroundColor: C.card }]}>
            <Scan size={36} color={C.primary} />
          </View>
          <Text style={[s.permTitle, { color: C.text }]}>Camera Access Needed</Text>
          <Text style={[s.permSub, { color: C.muted }]}>
            Allow camera access to start detecting FSL signs in real-time.
          </Text>
          <TouchableOpacity
            style={[s.permBtn, { backgroundColor: C.primary }]}
            onPress={requestPermission}
          >
            <Text style={s.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.statusBar} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => { stopDetection(); router.replace("/(student)/fsl" as any); }}
        >
          <ArrowLeft size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.text }]}>FSL Practice</Text>
        <View style={[s.countBadge, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.countBadgeText, { color: C.primary }]}>
            {completed.size}/{FSL_LETTERS.length}
          </Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={s.progressRow}>
        <View style={[s.progressBg, { backgroundColor: C.border }]}>
          <View style={[s.progressFill, {
            width: `${progressPct}%` as any,
            backgroundColor: C.primary,
          }]} />
        </View>
        <Text style={[s.progressPct, { color: C.primary }]}>{progressPct}%</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Letter Selector ── */}
        <Text style={[s.sectionLabel, { color: C.subtext }]}>Choose a Letter</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.letterRow}
        >
          {FSL_LETTERS.map((letter) => {
            const isDone     = completed.has(letter);
            const isSelected = selectedLetter === letter;
            return (
              <TouchableOpacity
                key={letter}
                style={[
                  s.letterBtn,
                  { backgroundColor: C.card, borderColor: C.border },
                  isSelected && { backgroundColor: C.primary, borderColor: C.primary },
                  isDone && !isSelected && { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
                ]}
                onPress={() => selectLetter(letter)}
              >
                <Text style={[
                  s.letterBtnText,
                  { color: C.muted },
                  isSelected && { color: "#fff" },
                  isDone && !isSelected && { color: "#10B981" },
                ]}>
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
                <Text style={[s.tipTitle, { color: C.text }]}>
                  How to sign "{selectedLetter}"
                </Text>
                <Text style={[s.tipDesc, { color: C.muted }]}>
                  {TIPS[selectedLetter]}
                </Text>
              </View>
            </View>

            {/* ── Connection Error Banner ── ADDED */}
            {connectionError && (
              <View style={s.errorBanner}>
                <Text style={s.errorBannerTitle}>⚠️ Cannot connect to ML server</Text>
                <Text style={s.errorBannerSub}>
                  Make sure the server is running at:{"\n"}{MOBILE_ML_URL}
                </Text>
                <TouchableOpacity
                  style={s.retryBtn}
                  onPress={() => selectLetter(selectedLetter)}
                >
                  <Text style={s.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Camera ── */}
            <View style={[s.cameraWrap, { borderColor: isCorrect ? "#10B981" : C.border }]}>
              <CameraView ref={cameraRef} style={s.camera} facing="front" mute />

              {/* Frame guide */}
              <View style={[
                s.frameGuide,
                { borderColor: isCorrect ? "#10B981" : C.primary },
              ]} />

              {/* Badges */}
              {liveResult?.detected && !isCorrect && (
                <View style={[s.camBadge, { top: 12, left: 12, backgroundColor: C.primary }]}>
                  <Text style={s.camBadgeText}>Sign: {liveResult.sign}</Text>
                </View>
              )}
              {liveResult?.detected && !isCorrect && (
                <View style={[s.camBadge, { top: 12, right: 12, backgroundColor: "#059669" }]}>
                  <Text style={s.camBadgeText}>● Hand Detected</Text>
                </View>
              )}
              {isActive && !isCorrect && !liveResult?.detected && (
                <View style={[s.camBadge, {
                  bottom: 12, alignSelf: "center",
                  backgroundColor: "rgba(0,0,0,0.55)",
                }]}>
                  <Text style={s.camBadgeText}>🔍 Scanning...</Text>
                </View>
              )}

              {/* Correct overlay */}
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
                  <Text style={[s.liveSignBig, { color: C.primary }]}>
                    {liveResult.sign}
                  </Text>
                  <View style={s.liveDivider} />
                  <View style={s.liveConfCol}>
                    <Text style={[s.liveConfLabel, { color: C.muted }]}>Confidence</Text>
                    <Text style={[
                      s.liveConf,
                      { color: liveResult.confidence >= 0.7 ? "#10B981" : "#F59E0B" },
                    ]}>
                      {(liveResult.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={s.liveDivider} />
                  <View style={s.liveConfCol}>
                    <Text style={[s.liveConfLabel, { color: C.muted }]}>Target</Text>
                    <Text style={[s.liveSignBig, { color: C.primary }]}>
                      {selectedLetter}
                    </Text>
                  </View>
                </View>
                <Text style={[s.liveHint, { color: C.muted }]}>
                  Keep trying! Match the target letter above.
                </Text>
              </View>
            )}

            {/* ── Success Card ── */}
            {isCorrect && lastConfidence !== null && (
              <View style={s.successCard}>
                <CheckCircle color="#10B981" size={40} />
                <Text style={s.successTitle}>
                  Great job! You signed "{selectedLetter}" correctly!
                </Text>
                <Text style={s.successConf}>
                  Confidence: {(lastConfidence * 100).toFixed(1)}%
                </Text>
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
            <Text style={{ fontSize: 48 }}>👆</Text>
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
  container:      { flex: 1 },
  centered:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },

  // Permission
  permIcon:       { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  permTitle:      { fontSize: 20, fontWeight: "800", textAlign: "center" },
  permSub:        { fontSize: 13, textAlign: "center", lineHeight: 20 },
  permBtn:        { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, marginTop: 8 },
  permBtnText:    { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Header
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:        { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle:    { fontSize: 18, fontWeight: "800" },
  countBadge:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  countBadgeText: { fontWeight: "700", fontSize: 13 },

  // Progress
  progressRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  progressBg:     { flex: 1, borderRadius: 99, height: 8 },
  progressFill:   { height: 8, borderRadius: 99 },
  progressPct:    { fontWeight: "700", fontSize: 13 },

  scroll:         { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel:   { fontSize: 13, fontWeight: "600", marginBottom: 10 },

  // Letter selector
  letterRow:      { marginBottom: 16 },
  letterBtn:      { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1 },
  letterBtnText:  { fontWeight: "700", fontSize: 14 },

  // Tip card
  tipCard:        { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1 },
  tipIcon:        { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tipIconText:    { color: "#fff", fontWeight: "900", fontSize: 22 },
  tipTitle:       { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  tipDesc:        { fontSize: 12, lineHeight: 18 },

  // Error banner — ADDED
  errorBanner:    { backgroundColor: "#FEE2E2", borderColor: "#EF4444", borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16, alignItems: "center", gap: 6 },
  errorBannerTitle: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
  errorBannerSub: { color: "#DC2626", fontSize: 12, textAlign: "center", lineHeight: 18 },
  retryBtn:       { backgroundColor: "#EF4444", paddingVertical: 8, paddingHorizontal: 24, borderRadius: 10, marginTop: 4 },
  retryBtnText:   { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Camera
  cameraWrap:     { borderRadius: 20, overflow: "hidden", height: 300, marginBottom: 16, borderWidth: 2, position: "relative" },
  camera:         { flex: 1 },
  frameGuide:     { position: "absolute", top: "10%", left: "10%", width: "80%", height: "80%", borderWidth: 2, borderRadius: 14 },
  camBadge:       { position: "absolute", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  camBadgeText:   { color: "#fff", fontWeight: "700", fontSize: 12 },
  correctOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(16,185,129,0.6)", alignItems: "center", justifyContent: "center" },
  correctEmoji:   { fontSize: 48 },
  correctText:    { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },

  // Live card
  liveCard:       { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1 },
  liveRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 10 },
  liveSignBig:    { fontSize: 48, fontWeight: "900" },
  liveDivider:    { width: 1, height: 40, backgroundColor: "#E5E7EB" },
  liveConfCol:    { alignItems: "center", gap: 4 },
  liveConfLabel:  { fontSize: 11 },
  liveConf:       { fontSize: 22, fontWeight: "800" },
  liveHint:       { fontSize: 12, textAlign: "center" },

  // Success card
  successCard:    { backgroundColor: "#D1FAE5", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#10B981", marginBottom: 16, gap: 6 },
  successTitle:   { color: "#065F46", fontWeight: "700", fontSize: 15, textAlign: "center" },
  successConf:    { color: "#059669", fontSize: 13 },
  nextBtn:        { backgroundColor: "#10B981", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, marginTop: 8 },
  nextBtnText:    { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Empty
  emptyState:     { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText:      { fontSize: 14, textAlign: "center" },
});