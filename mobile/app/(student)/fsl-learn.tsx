import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import {
  ClipboardList, CheckCircle, XCircle, Trophy,
  RotateCcw, ChevronRight, Clock, Star, BookOpen,
  ArrowLeft,
} from "lucide-react-native";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

type QuizState = "menu" | "quiz" | "review";

const QUESTION_BANK: Question[] = [
  { id: 1,  question: "Which letter uses a closed fist with the thumb resting on the side?",              options: ["A","S","E","T"], correct: "A", explanation: "Letter A is a closed fist with the thumb resting on the side of the index finger." },
  { id: 2,  question: "Which letter is signed with four fingers pointing straight up and thumb tucked?",  options: ["B","D","F","H"], correct: "B", explanation: "Letter B uses four fingers straight up with the thumb tucked across the palm." },
  { id: 3,  question: 'Which letter forms a curved "C" shape with the hand?',                            options: ["C","G","O","U"], correct: "C", explanation: "Letter C curves the hand into the shape of the letter C." },
  { id: 4,  question: "Which letter uses only the pinky finger raised?",                                  options: ["I","Y","G","L"], correct: "I", explanation: "Letter I is signed by raising only the pinky finger." },
  { id: 5,  question: 'Which letter forms an "L" shape with the index finger up and thumb pointing out?', options: ["L","F","K","V"], correct: "L", explanation: "Letter L uses the index finger pointing up and the thumb pointing sideways forming an L." },
  { id: 6,  question: "Which letter extends the thumb and pinky with other fingers curled?",              options: ["Y","I","A","K"], correct: "Y", explanation: "Letter Y extends the thumb and pinky finger outward." },
  { id: 7,  question: "Which letter makes a fist with the thumb over the fingers?",                      options: ["S","A","M","E"], correct: "S", explanation: "Letter S is made with a closed fist and the thumb wrapped over the fingers." },
  { id: 8,  question: "Which letter crosses the index and middle fingers?",                               options: ["R","U","V","K"], correct: "R", explanation: "Letter R is signed by crossing the index and middle fingers." },
  { id: 9,  question: "Which letter holds two fingers pointing sideways, parallel to each other?",       options: ["H","U","V","N"], correct: "H", explanation: "Letter H uses two fingers pointing sideways, parallel to the ground." },
  { id: 10, question: 'Which letter spreads index and middle fingers into a "V" shape?',                 options: ["V","R","U","K"], correct: "V", explanation: "Letter V spreads the index and middle fingers apart like a peace sign." },
  { id: 11, question: "Which letter curls the index finger into a hook shape?",                          options: ["X","D","F","G"], correct: "X", explanation: "Letter X hooks the index finger into a curved shape." },
  { id: 12, question: "Which letter has three fingers spread wide apart?",                                options: ["W","M","V","N"], correct: "W", explanation: "Letter W spreads three fingers outward." },
  { id: 13, question: "Which letter uses all fingers and thumb forming a circle?",                       options: ["O","C","F","D"], correct: "O", explanation: "Letter O curves all fingers and thumb into a circle shape." },
  { id: 14, question: "Which letter has the index finger pointing sideways with thumb parallel?",        options: ["G","H","D","P"], correct: "G", explanation: "Letter G points the index finger sideways with the thumb parallel to it." },
  { id: 15, question: "Which letter curls all four fingers with the thumb tucked under?",                options: ["E","S","A","M"], correct: "E", explanation: "Letter E curls all four fingers downward with the thumb tucked beneath them." },
];

const QUIZ_LENGTH = 10;

export default function FSLLearnScreen() {
  const router            = useRouter();
  const { resolvedTheme } = useThemeStore();
  const C                 = getColors(resolvedTheme);

  const [quizState, setQuizState]     = useState<QuizState>("menu");
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selected, setSelected]       = useState<string | null>(null);
  const [answers, setAnswers]         = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft]       = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [bestScore, setBestScore]     = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!timerActive || selected !== null) return;
    if (timeLeft <= 0) { handleAnswer("__timeout__"); return; }
    timerRef.current = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timerActive, timeLeft, selected]);

  const shuffleQuestions = useCallback(() => {
    return [...QUESTION_BANK]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUIZ_LENGTH)
      .map((q) => ({ ...q, options: [...q.options].sort(() => Math.random() - 0.5) }));
  }, []);

  const startQuiz = () => {
    setQuestions(shuffleQuestions());
    setCurrentIdx(0);
    setAnswers({});
    setSelected(null);
    setTimeLeft(20);
    setTimerActive(true);
    setQuizState("quiz");
  };

  const handleAnswer = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    setTimerActive(false);
    setAnswers((prev) => ({ ...prev, [currentIdx]: option }));
  }, [selected, currentIdx]);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
      setSelected(null);
      setTimeLeft(20);
      setTimerActive(true);
    } else {
      const total = questions.filter((q, i) => {
        const ans = i === currentIdx ? selected : answers[i];
        return ans === q.correct;
      }).length;
      if (total > bestScore) setBestScore(total);
      setQuizState("review");
    }
  };

  const finalScore = quizState === "review"
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;
  const pct        = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;
  const currentQ   = questions[currentIdx];

  // ─── MENU ────────────────────────────────────────────────────────
  if (quizState === "menu") {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Back + Header */}
          <View style={s.topRow}>
            <TouchableOpacity
              style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => router.replace("/(student)/fsl" as any)}
            >
              <ArrowLeft size={18} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={[s.pageTitle, { color: C.text }]}>FSL Quiz</Text>
              <Text style={[s.pageSub, { color: C.muted }]}>Test your knowledge</Text>
            </View>
          </View>

          {/* Best Score Banner */}
          <View style={s.hsBanner}>
            <View style={s.hsBannerLeft}>
              <Text style={s.hsLabel}>🏆 Best Score</Text>
              <Text style={s.hsScore}>
                {bestScore}
                <Text style={s.hsTotal}>/{QUIZ_LENGTH}</Text>
              </Text>
              <Text style={s.hsSub}>
                {bestScore === 0 ? "No attempts yet" : `${Math.round((bestScore / QUIZ_LENGTH) * 100)}% correct`}
              </Text>
            </View>
            <Trophy size={52} color="#FECACA" />
          </View>

          {/* Quiz Info Card */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.cardTitle, { color: C.text }]}>FSL Alphabet Quiz</Text>
            <View style={s.infoRow}>
              <View style={[s.infoBox, { backgroundColor: C.inputBg }]}>
                <View style={[s.infoIcon, { backgroundColor: "#EDE9FE" }]}>
                  <ClipboardList size={18} color="#7C3AED" />
                </View>
                <Text style={[s.infoVal, { color: C.text }]}>{QUIZ_LENGTH}</Text>
                <Text style={[s.infoLabel, { color: C.muted }]}>Questions</Text>
              </View>
              <View style={[s.infoBox, { backgroundColor: C.inputBg }]}>
                <View style={[s.infoIcon, { backgroundColor: "#FFF7ED" }]}>
                  <Clock size={18} color="#F97316" />
                </View>
                <Text style={[s.infoVal, { color: C.text }]}>20s</Text>
                <Text style={[s.infoLabel, { color: C.muted }]}>Per Question</Text>
              </View>
              <View style={[s.infoBox, { backgroundColor: C.inputBg }]}>
                <View style={[s.infoIcon, { backgroundColor: "#FEFCE8" }]}>
                  <Star size={18} color="#CA8A04" />
                </View>
                <Text style={[s.infoVal, { color: C.text }]}>A–Z</Text>
                <Text style={[s.infoLabel, { color: C.muted }]}>Topic</Text>
              </View>
            </View>
            <Text style={[s.cardDesc, { color: C.muted }]}>
              Questions are randomized each time. You have 20 seconds per question.
              Choose the correct FSL letter based on the description.
            </Text>
            <TouchableOpacity
              style={[s.startBtn, { backgroundColor: C.primary }]}
              onPress={startQuiz}
            >
              <ClipboardList size={18} color="#fff" />
              <Text style={s.startBtnText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>

          {/* Study Tip */}
          <View style={[s.tipBox, { backgroundColor: C.card, borderColor: C.border }]}>
            <BookOpen size={18} color={C.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[s.tipTitle, { color: C.text }]}>Study Tip</Text>
              <Text style={[s.tipDesc, { color: C.muted }]}>
                Practice the letters in the FSL Detection section before taking the quiz for better results!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── QUIZ ─────────────────────────────────────────────────────────
  if (quizState === "quiz" && currentQ) {
    const timerPct = (timeLeft / 20) * 100;

    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Progress + Timer */}
          <View style={s.progressRow}>
            <Text style={[s.progressText, { color: C.muted }]}>
              {currentIdx + 1} / {questions.length}
            </Text>
            <View style={[s.progressBarBg, { backgroundColor: C.border }]}>
              <View style={[s.progressBar, {
                width: `${((currentIdx + 1) / questions.length) * 100}%` as any,
                backgroundColor: C.primary,
              }]} />
            </View>
            <View style={s.timerBadge}>
              <Clock size={13} color={timeLeft <= 5 ? "#EF4444" : C.muted} />
              <Text style={[s.timerText, { color: timeLeft <= 5 ? "#EF4444" : C.muted }]}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Timer bar */}
          <View style={[s.timerBarBg, { backgroundColor: C.border }]}>
            <View style={[s.timerBar, {
              width: `${timerPct}%` as any,
              backgroundColor: timeLeft <= 5 ? "#EF4444" : C.primary,
            }]} />
          </View>

          {/* Question Card */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.questionText, { color: C.text }]}>{currentQ.question}</Text>

            {/* Options */}
            <View style={s.optionsGrid}>
              {currentQ.options.map((option) => {
                const isCorrectOpt = option === currentQ.correct;
                const isSelectedOpt = option === selected;
                const isWrong = isSelectedOpt && selected !== currentQ.correct;

                let bgColor   = C.inputBg;
                let borderCol = C.border;
                let textColor = C.text;

                if (selected !== null) {
                  if (isCorrectOpt) {
                    bgColor = "#ECFDF5"; borderCol = "#059669"; textColor = "#059669";
                  } else if (isWrong) {
                    bgColor = "#FEF2F2"; borderCol = "#DC2626"; textColor = "#DC2626";
                  }
                }

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      s.optionBtn,
                      { backgroundColor: bgColor, borderColor: borderCol },
                      selected !== null && !isCorrectOpt && !isWrong && { opacity: 0.4 },
                    ]}
                    onPress={() => handleAnswer(option)}
                    disabled={selected !== null}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.optionLetter, { color: textColor }]}>{option}</Text>
                    {selected !== null && isCorrectOpt && (
                      <CheckCircle size={16} color="#059669" style={s.optionIcon} />
                    )}
                    {isWrong && (
                      <XCircle size={16} color="#DC2626" style={s.optionIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation */}
            {selected !== null && (
              <View style={[
                s.explanation,
                selected === currentQ.correct ? s.explanationCorrect : s.explanationWrong,
              ]}>
                <View style={{ marginTop: 2 }}>
                  {selected === currentQ.correct
                    ? <CheckCircle size={16} color="#059669" />
                    : <XCircle size={16} color="#DC2626" />}
                </View>
                <Text style={[
                  s.explanationText,
                  { color: selected === currentQ.correct ? "#065F46" : "#991B1B" },
                ]}>
                  {selected === "__timeout__"
                    ? `Time's up! The answer was "${currentQ.correct}". `
                    : selected === currentQ.correct
                      ? "Correct! "
                      : `Incorrect. The answer is "${currentQ.correct}". `}
                  {currentQ.explanation}
                </Text>
              </View>
            )}
          </View>

          {/* Next Button */}
          {selected !== null && (
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: C.primary }]}
              onPress={handleNext}
            >
              {currentIdx < questions.length - 1 ? (
                <>
                  <ChevronRight size={18} color="#fff" />
                  <Text style={s.nextBtnText}>Next Question</Text>
                </>
              ) : (
                <>
                  <Trophy size={18} color="#fff" />
                  <Text style={s.nextBtnText}>See Results</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={s.quitBtn}
            onPress={() => { setQuizState("menu"); setTimerActive(false); }}
          >
            <Text style={[s.quitText, { color: C.muted }]}>Quit Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── REVIEW ──────────────────────────────────────────────────────
  if (quizState === "review") {
    const bannerColor = pct >= 80 ? "#059669" : pct >= 60 ? "#8B1A1A" : "#F97316";
    const message     = pct >= 80 ? "🎉 Excellent work!" : pct >= 60 ? "👍 Good job!" : "📚 Keep practicing!";

    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.background }]}>
        <StatusBar style={C.statusBar} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Score Banner */}
          <View style={[s.scoreCard, { backgroundColor: bannerColor }]}>
            <View style={s.trophyWrap}>
              <Trophy size={48} color="#FDE68A" />
            </View>
            <Text style={s.scoreCardLabel}>You scored</Text>
            <Text style={s.scoreCardVal}>
              {finalScore}
              <Text style={s.scoreCardTotal}>/{questions.length}</Text>
            </Text>
            <Text style={s.scoreCardMsg}>{message}</Text>
            <Text style={s.scoreCardPct}>{pct}% correct</Text>
          </View>

          {/* Review items */}
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const correct    = userAnswer === q.correct;
            return (
              <View
                key={q.id}
                style={[
                  s.reviewCard,
                  { backgroundColor: C.card },
                  { borderColor: correct ? "#059669" : "#DC2626" },
                ]}
              >
                <View style={{ marginTop: 2 }}>
                  {correct
                    ? <CheckCircle size={18} color="#059669" />
                    : <XCircle size={18} color="#DC2626" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.reviewQ, { color: C.text }]}>
                    Q{i + 1}. {q.question}
                  </Text>
                  <View style={s.reviewAnswerRow}>
                    <View style={[s.reviewBadge, correct ? s.reviewBadgeCorrect : s.reviewBadgeWrong]}>
                      <Text style={[s.reviewBadgeText, { color: correct ? "#065F46" : "#991B1B" }]}>
                        Your answer: {userAnswer === "__timeout__" ? "No answer (timeout)" : userAnswer}
                      </Text>
                    </View>
                    {!correct && (
                      <View style={[s.reviewBadge, s.reviewBadgeCorrect]}>
                        <Text style={[s.reviewBadgeText, { color: "#065F46" }]}>
                          Correct: {q.correct}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!correct && (
                    <Text style={[s.reviewExplanation, { color: C.muted }]}>
                      {q.explanation}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Actions */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.primary }]}
              onPress={startQuiz}
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={s.actionBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]}
              onPress={() => setQuizState("menu")}
            >
              <ClipboardList size={16} color={C.text} />
              <Text style={[s.actionBtnText, { color: C.text }]}>Quiz Menu</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  container:          { flex: 1 },
  scroll:             { padding: 16, gap: 14, paddingBottom: 32 },

  // Top row
  topRow:             { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  backBtn:            { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pageTitle:          { fontSize: 22, fontWeight: "800" },
  pageSub:            { fontSize: 12, marginTop: 1 },

  // High score banner
  hsBanner:           {
    backgroundColor: "#8B1A1A", borderRadius: 24, padding: 22,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#8B1A1A", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  hsBannerLeft:       { gap: 4 },
  hsLabel:            { color: "#FECACA", fontSize: 13, fontWeight: "600" },
  hsScore:            { color: "#fff", fontSize: 42, fontWeight: "900" },
  hsTotal:            { fontSize: 22, color: "#FECACA" },
  hsSub:              { color: "#FECACA", fontSize: 11 },

  // Card
  card:               { borderRadius: 20, padding: 18, gap: 12, borderWidth: 1 },
  cardTitle:          { fontSize: 17, fontWeight: "800" },
  cardDesc:           { fontSize: 13, lineHeight: 20 },

  // Info row
  infoRow:            { flexDirection: "row", gap: 10 },
  infoBox:            { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  infoIcon:           { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoVal:            { fontSize: 18, fontWeight: "800" },
  infoLabel:          { fontSize: 11, textAlign: "center" },

  // Start button
  startBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  startBtnText:       { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Tip
  tipBox:             { flexDirection: "row", gap: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  tipTitle:           { fontWeight: "700", fontSize: 13, marginBottom: 4 },
  tipDesc:            { fontSize: 12, lineHeight: 18 },

  // Progress
  progressRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
  progressText:       { fontSize: 12, fontWeight: "600", minWidth: 40 },
  progressBarBg:      { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressBar:        { height: 6, borderRadius: 3 },
  timerBadge:         { flexDirection: "row", alignItems: "center", gap: 4 },
  timerText:          { fontSize: 13, fontWeight: "700" },
  timerBarBg:         { height: 3, borderRadius: 2, overflow: "hidden", marginBottom: 4 },
  timerBar:           { height: 3, borderRadius: 2 },

  // Question
  questionText:       { fontSize: 16, fontWeight: "600", lineHeight: 24, textAlign: "center" },

  // Options
  optionsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionBtn:          { width: "47%", aspectRatio: 1.4, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  optionLetter:       { fontSize: 28, fontWeight: "900" },
  optionIcon:         { position: "absolute", top: 8, right: 8 },

  // Explanation
  explanation:        { flexDirection: "row", gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  explanationCorrect: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  explanationWrong:   { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  explanationText:    { flex: 1, fontSize: 13, lineHeight: 20 },

  // Next / Quit
  nextBtn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  nextBtnText:        { color: "#fff", fontWeight: "700", fontSize: 15 },
  quitBtn:            { alignItems: "center", paddingVertical: 10 },
  quitText:           { fontSize: 13 },

  // Score card
  scoreCard:          { borderRadius: 24, padding: 32, alignItems: "center", gap: 4 },
  trophyWrap:         { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  scoreCardLabel:     { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  scoreCardVal:       { color: "#fff", fontSize: 56, fontWeight: "900" },
  scoreCardTotal:     { fontSize: 28, color: "rgba(255,255,255,0.5)" },
  scoreCardMsg:       { color: "#fff", fontSize: 17, fontWeight: "600", marginTop: 4 },
  scoreCardPct:       { color: "rgba(255,255,255,0.6)", fontSize: 13 },

  // Review
  reviewCard:         { flexDirection: "row", gap: 12, borderRadius: 16, padding: 14, borderWidth: 2 },
  reviewQ:            { fontSize: 13, fontWeight: "500", marginBottom: 8, lineHeight: 20 },
  reviewAnswerRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reviewBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  reviewBadgeCorrect: { backgroundColor: "#D1FAE5" },
  reviewBadgeWrong:   { backgroundColor: "#FEE2E2" },
  reviewBadgeText:    { fontSize: 11, fontWeight: "600" },
  reviewExplanation:  { fontSize: 12, marginTop: 6, lineHeight: 18 },

  // Actions
  actionRow:          { flexDirection: "row", gap: 10 },
  actionBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  actionBtnText:      { color: "#fff", fontWeight: "700", fontSize: 14 },
});