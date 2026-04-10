import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import {
  Gamepad2, Trophy, Zap, RotateCcw,
  Play, Star, Clock, Target, ArrowLeft,
} from "lucide-react-native";
import { FSLCamera } from "../../components/camera/FSLCamera";
import { capturePhoto } from "../../components/camera/capturePhoto";

const MOBILE_ML_URL = "http://192.168.1.24:8001";
const FSL_LETTERS = ["A","B","C","D","E","F","G","H","I","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y"];
const SPEED_DURATION = 60;
const STREAK_TARGET = 10;

type GameMode = "menu" | "speed" | "streak" | "result";
interface GameResult {
  score: number;
  mode: string;
  lettersCompleted: string[];
  timeUsed?: number;
}

export default function FSLGameScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C = getColors(resolvedTheme);

  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [currentLetter, setCurrentLetter] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPEED_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState<"correct" | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [lettersCompleted, setLettersCompleted] = useState<string[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [liveSign, setLiveSign] = useState<string | null>(null);
  const [liveConf, setLiveConf] = useState(0);
  const [handDetected, setHandDetected] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<any>(null);
  const currentLetterRef = useRef("");
  const scoreRef = useRef(0);
  const completedRef = useRef<string[]>([]);
  const isActiveRef = useRef(false);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { currentLetterRef.current = currentLetter; }, [currentLetter]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { completedRef.current = lettersCompleted; }, [lettersCompleted]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0, duration: 500, useNativeDriver: true,
    }).start();
  };

  const getRandomLetter = useCallback((exclude?: string) => {
    const pool = FSL_LETTERS.filter((l) => l !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (scanRef.current) clearInterval(scanRef.current);
    setIsActive(false);
  }, []);

  const endGame = useCallback((finalScore: number, mode: string, completed: string[], timeUsed?: number) => {
    stopAll();
    if (finalScore > highScore) setHighScore(finalScore);
    setResult({ score: finalScore, mode, lettersCompleted: completed, timeUsed });
    setGameMode("result");
  }, [highScore, stopAll]);

  useEffect(() => {
    if (gameMode === "speed" && isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame(scoreRef.current, "Speed Challenge", completedRef.current, SPEED_DURATION);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameMode, isActive]);

  const captureAndCheck = useCallback(async () => {
    if (!cameraRef.current || !isActiveRef.current) return;
    try {
      const base64 = await capturePhoto(cameraRef);
      if (!base64) return;

      const res = await fetch(`${MOBILE_ML_URL}/predict-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();

      setHandDetected(!!data.detected);
      setLiveSign(data.sign ?? null);
      setLiveConf(data.confidence ?? 0);

      if (data.detected && data.sign === currentLetterRef.current && data.confidence >= 0.7) {
        const newScore = scoreRef.current + Math.round(data.confidence * 100);
        const newCompleted = [...completedRef.current, currentLetterRef.current];
        setScore(newScore); scoreRef.current = newScore;
        setLettersCompleted(newCompleted); completedRef.current = newCompleted;
        setStreak((s) => s + 1);
        setFlash("correct");
        triggerFlash();
        setTimeout(() => setFlash(null), 400);
        if (completedRef.current.length >= STREAK_TARGET) {
          endGame(newScore, "Letter Streak", completedRef.current);
          return;
        }
        const next = getRandomLetter(currentLetterRef.current);
        setCurrentLetter(next); currentLetterRef.current = next;
      }
    } catch { /* silent */ }
  }, [getRandomLetter, endGame]);

  const startScanning = useCallback(() => {
    if (scanRef.current) clearInterval(scanRef.current);
    scanRef.current = setInterval(captureAndCheck, 800);
  }, [captureAndCheck]);

  const startSpeedMode = () => {
    const letter = getRandomLetter();
    setScore(0); scoreRef.current = 0;
    setStreak(0); setTimeLeft(SPEED_DURATION);
    setLettersCompleted([]); completedRef.current = [];
    setCurrentLetter(letter); currentLetterRef.current = letter;
    setIsActive(true); isActiveRef.current = true;
    setGameMode("speed");
    setTimeout(startScanning, 300);
  };

  const startStreakMode = () => {
    const letter = getRandomLetter();
    setScore(0); scoreRef.current = 0;
    setStreak(0);
    setLettersCompleted([]); completedRef.current = [];
    setCurrentLetter(letter); currentLetterRef.current = letter;
    setIsActive(true); isActiveRef.current = true;
    setGameMode("streak");
    setTimeout(startScanning, 300);
  };

  const quitGame = () => { stopAll(); setGameMode("menu"); };

  // ─── MENU ────────────────────────────────────────────────────────
  if (gameMode === "menu") {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Back + Header */}
          <View style={s.topRow}>
            <TouchableOpacity
              style={[s.backBtn, { borderColor: C.border, backgroundColor: C.card }]}
              onPress={() => router.replace("/(student)/fsl" as any)}
            >
              <ArrowLeft size={18} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={[s.pageTitle, { color: C.text }]}>FSL Games</Text>
              <Text style={[s.pageSub, { color: C.muted }]}>Pick a game to play</Text>
            </View>
          </View>

          {/* High Score Banner */}
          <View style={s.hsBanner}>
            <View style={s.hsBannerLeft}>
              <Text style={s.hsLabel}>🏆 Your High Score</Text>
              <Text style={s.hsScore}>{highScore.toLocaleString()}</Text>
              <Text style={s.hsSub}>Keep signing to beat it!</Text>
            </View>
            <Trophy size={48} color="#FECACA" />
          </View>

          {/* Speed Challenge */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.modeHeader}>
              <View style={[s.iconBox, { backgroundColor: "#F59E0B22" }]}>
                <Zap size={24} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: C.text }]}>Speed Challenge</Text>
                <Text style={[s.cardDesc, { color: C.muted }]}>
                  Sign as many letters as you can in{" "}60 seconds.
                </Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <View style={[s.metaPill, { backgroundColor: "#F59E0B22" }]}>
                <Clock size={12} color="#F59E0B" />
                <Text style={[s.metaText, { color: "#F59E0B" }]}>60 seconds</Text>
              </View>
              <View style={[s.metaPill, { backgroundColor: C.primary + "22" }]}>
                <Star size={12} color={C.primary} />
                <Text style={[s.metaText, { color: C.primary }]}>Score based</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.playBtn, { backgroundColor: "#F59E0B" }]} onPress={startSpeedMode}>
              <Play size={16} color="#fff" />
              <Text style={s.playBtnText}>Play Now</Text>
            </TouchableOpacity>
          </View>

          {/* Letter Streak */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.modeHeader}>
              <View style={[s.iconBox, { backgroundColor: C.primary + "22" }]}>
                <Target size={24} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: C.text }]}>Letter Streak</Text>
                <Text style={[s.cardDesc, { color: C.muted }]}>
                  Sign{" "}{STREAK_TARGET} letters{" "}in a row. No timer — just accuracy.
                </Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <View style={[s.metaPill, { backgroundColor: C.primary + "22" }]}>
                <Target size={12} color={C.primary} />
                <Text style={[s.metaText, { color: C.primary }]}>{STREAK_TARGET} letters</Text>
              </View>
              <View style={[s.metaPill, { backgroundColor: "#10B98122" }]}>
                <Star size={12} color="#10B981" />
                <Text style={[s.metaText, { color: "#10B981" }]}>Accuracy based</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.playBtn, { backgroundColor: C.primary }]} onPress={startStreakMode}>
              <Play size={16} color="#fff" />
              <Text style={s.playBtnText}>Play Now</Text>
            </TouchableOpacity>
          </View>

          {/* How to Play */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.cardTitle, { color: C.text, marginBottom: 12 }]}>How to Play</Text>
            {[
              { step: "1", title: "Pick a Game", desc: "Choose Speed Challenge or Letter Streak" },
              { step: "2", title: "Sign the Letter", desc: "Show your hand to the camera and sign the displayed letter" },
              { step: "3", title: "Score Points", desc: "Higher confidence = more points" },
            ].map(({ step, title, desc }) => (
              <View key={step} style={s.howRow}>
                <View style={[s.howBadge, { backgroundColor: C.primary }]}>
                  <Text style={s.howBadgeText}>{step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.howTitle, { color: C.text }]}>{title}</Text>
                  <Text style={[s.howDesc, { color: C.muted }]}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GAME ─────────────────────────────────────────────────────────
  if (gameMode === "speed" || gameMode === "streak") {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

        {/* HUD */}
        <View style={s.hud}>
          <View style={[s.hudBox, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.hudLabel, { color: C.muted }]}>Score</Text>
            <Text style={[s.hudValue, { color: C.text }]}>{score.toLocaleString()}</Text>
          </View>

          {gameMode === "speed" && (
            <View style={[s.hudBox, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.hudLabel, { color: C.muted }]}>Time</Text>
              <Text style={[s.hudValue, { color: timeLeft <= 10 ? "#EF4444" : C.text }]}>{timeLeft}s</Text>
              <View style={[s.timerBarBg, { backgroundColor: C.border }]}>
                <View style={[s.timerBar, {
                  width: `${(timeLeft / SPEED_DURATION) * 100}%` as any,
                  backgroundColor: timeLeft <= 10 ? "#EF4444" : C.primary,
                }]} />
              </View>
            </View>
          )}

          {gameMode === "streak" && (
            <View style={[s.hudBox, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.hudLabel, { color: C.muted }]}>Progress</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                <Text style={[s.hudValue, { color: C.primary }]}>{lettersCompleted.length}</Text>
                <Text style={[s.hudLabel, { color: C.muted }]}>/{STREAK_TARGET}</Text>
              </View>
            </View>
          )}

          <View style={[s.targetBox, { backgroundColor: C.primary + "22", borderColor: C.primary + "44", borderWidth: 1, borderRadius: 16 }]}>
            <Text style={[s.targetLabel, { color: C.muted }]}>
              {flash === "correct" ? "✅ Correct!" : "Sign this"}
            </Text>
            <Text style={[s.targetLetter, { color: C.primary }]}>{currentLetter}</Text>
          </View>
        </View>

        {/* Camera */}
        <View style={[s.cameraWrap, { borderColor: flash === "correct" ? "#10B981" : C.border }]}>
          <FSLCamera ref={cameraRef} />
          <View style={[s.badge, { top: 10, left: 10, backgroundColor: handDetected ? "#10B981" : "#6B7280" }]}>
            <Text style={s.badgeText}>{handDetected ? "● Hand Detected" : "○ No Hand"}</Text>
          </View>
          <View style={[s.badge, { top: 10, right: 10, backgroundColor: C.primary }]}>
            <Text style={s.badgeText}>Sign: {currentLetter}</Text>
          </View>
        </View>

        {/* Live result row */}
        <View style={[s.liveCard, { backgroundColor: C.card, borderTopWidth: 1, borderColor: C.border }]}>
          <View style={s.liveCol}>
            <Text style={[s.liveLabel, { color: C.muted }]}>Detected</Text>
            <Text style={[s.liveSign, { color: C.text }]}>{liveSign ?? "—"}</Text>
          </View>
          <View style={[s.liveDivider, { backgroundColor: C.border }]} />
          <View style={s.liveCol}>
            <Text style={[s.liveLabel, { color: C.muted }]}>Confidence</Text>
            <Text style={[s.liveConf, { color: liveConf >= 0.7 ? "#10B981" : "#F59E0B" }]}>
              {liveSign ? `${Math.round(liveConf * 100)}%` : "—"}
            </Text>
          </View>
          <View style={[s.liveDivider, { backgroundColor: C.border }]} />
          <View style={s.liveCol}>
            <Text style={[s.liveLabel, { color: C.muted }]}>Target</Text>
            <Text style={[s.liveSign, { color: C.primary }]}>{currentLetter}</Text>
          </View>
        </View>

        {/* Completed chips */}
        {lettersCompleted.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
            {lettersCompleted.slice(-12).map((l, i) => (
              <View key={i} style={[s.chip, { backgroundColor: C.primary + "22" }]}>
                <Text style={[s.chipText, { color: C.primary }]}>{l}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={s.quitBtn} onPress={quitGame}>
          <RotateCcw size={14} color={C.muted} />
          <Text style={[s.quitText, { color: C.muted }]}>Quit Game</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── RESULT ──────────────────────────────────────────────────────
  if (gameMode === "result" && result) {
    const isNewHigh = result.score >= highScore;
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <ScrollView contentContainerStyle={[s.scroll, { alignItems: "center", paddingTop: 40 }]}>

          {isNewHigh && (
            <View style={s.newHighBadge}>
              <Star size={14} color="#854D0E" />
              <Text style={s.newHighText}>New High Score!</Text>
            </View>
          )}

          <View style={[s.trophyWrap, { backgroundColor: "#8B1A1A" }]}>
            <Trophy size={44} color="#FECACA" />
          </View>

          <Text style={[s.resultTitle, { color: C.text }]}>{result.mode}</Text>
          <Text style={[s.resultSub, { color: C.muted }]}>Game Complete!</Text>

          <View style={s.statsRow}>
            <View style={[s.statBox, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]}>
              <Text style={[s.statVal, { color: C.text }]}>{result.score.toLocaleString()}</Text>
              <Text style={[s.statLabel, { color: C.muted }]}>Score</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]}>
              <Text style={[s.statVal, { color: C.text }]}>{result.lettersCompleted.length}</Text>
              <Text style={[s.statLabel, { color: C.muted }]}>Letters</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]}>
              <Text style={[s.statVal, { color: C.text }]}>
                {result.timeUsed ? `${SPEED_DURATION - timeLeft}s` : `${result.lettersCompleted.length}`}
              </Text>
              <Text style={[s.statLabel, { color: C.muted }]}>
                {result.timeUsed ? "Time" : "Streak"}
              </Text>
            </View>
          </View>

          <View style={s.resultBtns}>
            <TouchableOpacity
              style={[s.playBtn, { backgroundColor: C.primary, flex: 1 }]}
              onPress={() => result.mode === "Speed Challenge" ? startSpeedMode() : startStreakMode()}
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={s.playBtnText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.playBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, flex: 1 }]}
              onPress={() => setGameMode("menu")}
            >
              <Gamepad2 size={16} color={C.text} />
              <Text style={[s.playBtnText, { color: C.text }]}>All Games</Text>
            </TouchableOpacity>
          </View>

          {result.lettersCompleted.length > 0 && (
            <View style={[s.card, { backgroundColor: C.card, borderColor: C.border, width: "100%", marginTop: 8 }]}>
              <Text style={[s.cardTitle, { color: C.text, marginBottom: 12 }]}>
                Letters Signed ({result.lettersCompleted.length})
              </Text>
              <View style={s.completedGrid}>
                {result.lettersCompleted.map((l, i) => (
                  <View key={i} style={[s.completedChip, { backgroundColor: C.primary + "22" }]}>
                    <Text style={[s.completedChipText, { color: C.primary }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 22, fontWeight: "800" },
  pageSub: { fontSize: 12, marginTop: 1 },
  hsBanner: {
    backgroundColor: "#8B1A1A", borderRadius: 24, padding: 22,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#8B1A1A", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  hsBannerLeft: { gap: 4 },
  hsLabel: { color: "#FECACA", fontSize: 13, fontWeight: "600" },
  hsScore: { color: "#fff", fontSize: 42, fontWeight: "900" },
  hsSub: { color: "#FECACA", fontSize: 11 },
  card: { borderRadius: 20, padding: 18, gap: 10, borderWidth: 1 },
  modeHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardDesc: { fontSize: 13, lineHeight: 20 },
  metaRow: { flexDirection: "row", gap: 8 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metaText: { fontSize: 12, fontWeight: "600" },
  playBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  playBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  howBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  howBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  howTitle: { fontWeight: "700", fontSize: 13 },
  howDesc: { fontSize: 12, marginTop: 2, lineHeight: 18 },
  hud: { flexDirection: "row", padding: 12, gap: 8 },
  hudBox: { flex: 1, borderRadius: 16, padding: 10, alignItems: "center", borderWidth: 1 },
  hudLabel: { fontSize: 11, marginBottom: 2 },
  hudValue: { fontSize: 22, fontWeight: "900" },
  timerBarBg: { width: "100%", height: 4, borderRadius: 2, marginTop: 4 },
  timerBar: { height: 4, borderRadius: 2 },
  targetBox: { flex: 1, padding: 10, alignItems: "center", justifyContent: "center" },
  targetLabel: { fontSize: 11, marginBottom: 2 },
  targetLetter: { fontSize: 36, fontWeight: "900" },
  cameraWrap: { flex: 1, marginHorizontal: 12, borderRadius: 20, overflow: "hidden", borderWidth: 1 },
  badge: { position: "absolute", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  liveCard: { flexDirection: "row", padding: 14, justifyContent: "space-around", alignItems: "center" },
  liveDivider: { width: 1, height: 32 },
  liveCol: { alignItems: "center", flex: 1 },
  liveLabel: { fontSize: 11, marginBottom: 2 },
  liveSign: { fontSize: 26, fontWeight: "900" },
  liveConf: { fontSize: 22, fontWeight: "800" },
  chips: { paddingHorizontal: 12, paddingVertical: 8, maxHeight: 52 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6, alignItems: "center", justifyContent: "center" },
  chipText: { fontWeight: "700", fontSize: 13 },
  quitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14 },
  quitText: { fontSize: 14 },
  trophyWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  newHighBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF9C3", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  newHighText: { color: "#854D0E", fontWeight: "700", fontSize: 13 },
  resultTitle: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  resultSub: { fontSize: 13, marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 8, width: "100%" },
  statBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: "center" },
  resultBtns: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 8 },
  completedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  completedChip: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  completedChipText: { fontWeight: "800", fontSize: 15 },
});