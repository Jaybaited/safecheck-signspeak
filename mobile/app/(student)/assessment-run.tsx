import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../store/themeStore";
import { getColors } from "../../lib/theme";
import VideoBox from "../../components/assessment/VideoBox";
import {
  AssessmentDetail,
  AssessmentQuestion,
  LevelCard,
  completeAssessmentAttempt,
  getApiErrorMessage,
  getAssessment,
  getAssessmentAttempt,
  getErrorStatus,
  getMyLevels,
  isPasswordChangeRequired,
  saveAssessmentAnswer,
  startAssessmentAttempt,
} from "../../lib/assessments-api";

type Step = "loading" | "error" | "lesson" | "exam" | "submitted" | "passed";

export default function AssessmentRunScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const theme = useThemeStore((s) => s.resolvedTheme);
  const colors = getColors(theme);

  const [step, setStep] = useState<Step>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [card, setCard] = useState<LevelCard | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(student)/assessment" as any);
  };

  // Returns true when the student was sent to change the password
  const redirectIfPasswordChange = (e: unknown): boolean => {
    if (isPasswordChangeRequired(e)) {
      router.replace("/change-password" as any);
      return true;
    }
    return false;
  };

  // ── Load the assessment and the level card together ────────────────────────
  async function load(autoResume = true) {
    setStep("loading");
    setMessage(null);
    try {
      const [a, levels] = await Promise.all([getAssessment(id), getMyLevels()]);
      const sorted: AssessmentDetail = {
        ...a,
        questions: [...a.questions].sort((x, y) => x.order - y.order),
      };
      const c = levels.find((l) => l.id === id) ?? null;
      setAssessment(sorted);
      setCard(c);

      if (!c) {
        setMessage("This level is not available.");
        setStep("error");
        return;
      }
      switch (c.state) {
        case "LOCKED":
          setMessage("Pass the previous level first.");
          setStep("error");
          break;
        case "AWAITING_REVIEW":
          setStep("submitted");
          break;
        case "PASSED":
          setStep("passed");
          break;
        case "IN_PROGRESS":
          if (autoResume) {
            const ok = await enterExam(sorted);
            if (!ok) setStep("lesson");
          } else {
            setStep("lesson");
          }
          break;
        default: // AVAILABLE, FAILED
          setStep("lesson");
      }
    } catch (e) {
      if (redirectIfPasswordChange(e)) return;
      setMessage(getApiErrorMessage(e, "Could not load this level."));
      setStep("error");
    }
  }

  useEffect(() => {
    if (id) load();
    else {
      setMessage("Missing level.");
      setStep("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Start (or resume) the attempt and restore saved answers ────────────────
  // Returns true when it handled the screen (entered, redirected, or reloaded)
  async function enterExam(a: AssessmentDetail): Promise<boolean> {
    setBusy(true);
    try {
      const attempt = await startAssessmentAttempt(a.id);
      const detail = await getAssessmentAttempt(attempt.id);

      const restored: Record<string, string> = {};
      for (const r of detail.responses) {
        if (r.submittedSign) restored[r.questionId] = r.submittedSign;
      }
      const firstOpen = a.questions.findIndex((q) => !restored[q.id]);

      setAttemptId(attempt.id);
      setAnswers(restored);
      setIndex(firstOpen === -1 ? Math.max(a.questions.length - 1, 0) : firstOpen);
      setSaveError(null);
      setStep("exam");
      return true;
    } catch (e) {
      if (redirectIfPasswordChange(e)) return true;
      if (getErrorStatus(e) === 409) {
        // waiting for review, or already passed: show the message, then refresh the state
        Alert.alert("Not available", getApiErrorMessage(e, "You cannot start this level now."));
        await load(false);
        return true;
      }
      Alert.alert("Could not start", getApiErrorMessage(e, "Could not start the exam."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  // ── Save one answer. If the save fails, the old answer comes back ──────────
  async function selectAnswer(q: AssessmentQuestion, letter: string) {
    if (!attemptId || saving) return;
    const previous = answers[q.id];
    if (previous === letter) return;

    setAnswers((p) => ({ ...p, [q.id]: letter }));
    setSaving(true);
    setSaveError(null);
    try {
      await saveAssessmentAnswer(attemptId, q.id, letter);
    } catch (e) {
      setAnswers((p) => {
        const next = { ...p };
        if (previous === undefined) delete next[q.id];
        else next[q.id] = previous;
        return next;
      });
      if (redirectIfPasswordChange(e)) return;
      setSaveError(getApiErrorMessage(e, "Could not save your answer. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  // ── Finish ─────────────────────────────────────────────────────────────────
  function confirmFinish() {
    Alert.alert("Send your exam?", "You cannot change your answers after you send them.", [
      { text: "Review", style: "cancel" },
      { text: "Send", onPress: finishExam },
    ]);
  }

  async function finishExam() {
    if (!attemptId) return;
    setBusy(true);
    try {
      await completeAssessmentAttempt(attemptId);
      setStep("submitted");
    } catch (e) {
      if (redirectIfPasswordChange(e)) return;
      if (getErrorStatus(e) === 409) {
        setStep("submitted"); // already sent
        return;
      }
      Alert.alert("Could not send", getApiErrorMessage(e, "Could not send your exam. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  // ── Small UI pieces ────────────────────────────────────────────────────────
  const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  const PrimaryButton = ({
    label,
    onPress,
    disabled,
    loading,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: colors.primary }, (disabled || loading) && { opacity: 0.45 }]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </TouchableOpacity>
  );

  const Notice = ({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) => (
    <View style={styles.center}>
      <Ionicons name={icon} size={52} color={colors.primary} />
      <Text style={[styles.noticeTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.noticeText, { color: colors.subtext }]}>{text}</Text>
      <PrimaryButton label="Back to levels" onPress={goBack} />
    </View>
  );

  const title = assessment ? `Level ${assessment.level ?? ""} ${assessment.title ? "" : ""}`.trim() : "Assessment";

  // ── Screens ────────────────────────────────────────────────────────────────
  let body: React.ReactNode;

  if (step === "loading") {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (step === "error") {
    body = (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.text }]}>{message}</Text>
        <PrimaryButton label="Try again" onPress={() => load()} />
        <TouchableOpacity onPress={goBack}>
          <Text style={[styles.link, { color: colors.primary }]}>Back to levels</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (step === "submitted") {
    body = (
      <Notice
        icon="checkmark-done-circle-outline"
        title="Your answers were sent"
        text="Your teacher will check them. Your result will appear here after it is released."
      />
    );
  } else if (step === "passed") {
    body = (
      <Notice icon="ribbon-outline" title="Level passed" text="You already passed this level." />
    );
  } else if (step === "lesson" && assessment) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        <VideoBox mode="lesson" url={card?.lessonVideoUrl ?? assessment.lessonVideoUrl} />
        <Text style={[styles.lessonTitle, { color: colors.text }]}>{assessment.title}</Text>
        {!!(card?.lessonDescription ?? assessment.lessonDescription) && (
          <Text style={[styles.description, { color: colors.subtext }]}>
            {card?.lessonDescription ?? assessment.lessonDescription}
          </Text>
        )}
        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {assessment.questions.length} questions · Pass mark {assessment.passMark}%
          </Text>
        </View>
        <PrimaryButton label="Start the exam" onPress={() => enterExam(assessment)} loading={busy} />
      </ScrollView>
    );
  } else if (step === "exam" && assessment) {
    const total = assessment.questions.length;
    const q = assessment.questions[index];
    const answeredCount = assessment.questions.filter((x) => answers[x.id]).length;
    const allAnswered = total > 0 && answeredCount === total;
    const isLast = index === total - 1;
    const choices = Object.entries(q?.choices ?? {}).sort(([a], [b]) => a.localeCompare(b));

    body = q ? (
      <>
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${((index + 1) / total) * 100}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.subtext }]}>
            Question {index + 1} of {total} · {answeredCount} answered
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <VideoBox key={q.id} mode="exam" url={q.mediaUrl} />
          <Text style={[styles.prompt, { color: colors.text }]}>{q.prompt}</Text>

          {choices.length === 0 && (
            <Text style={{ color: colors.subtext }}>This question has no choices.</Text>
          )}
          {choices.map(([letter, text]) => {
            const selected = answers[q.id] === letter;
            return (
              <TouchableOpacity
                key={letter}
                disabled={saving}
                activeOpacity={0.85}
                onPress={() => selectAnswer(q, letter)}
                style={[
                  styles.choice,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View
                  style={[
                    styles.letter,
                    { backgroundColor: selected ? "#ffffff33" : colors.background },
                  ]}
                >
                  <Text style={[styles.letterText, { color: selected ? "#fff" : colors.text }]}>
                    {letter}
                  </Text>
                </View>
                <Text style={[styles.choiceText, { color: selected ? "#fff" : colors.text }]}>{text}</Text>
              </TouchableOpacity>
            );
          })}

          {!!saveError && <Text style={[styles.errorText, { color: colors.primary }]}>{saveError}</Text>}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.navBtn, { borderColor: colors.border }, index === 0 && { opacity: 0.4 }]}
            disabled={index === 0 || saving}
            onPress={() => setIndex((i) => Math.max(i - 1, 0))}
          >
            <Text style={[styles.navText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          {isLast ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={allAnswered ? "Finish" : `Answer all (${answeredCount}/${total})`}
                onPress={confirmFinish}
                disabled={!allAnswered || saving}
                loading={busy}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Next"
                onPress={() => setIndex((i) => Math.min(i + 1, total - 1))}
                disabled={saving}
              />
            </View>
          )}
        </View>
      </>
    ) : (
      <Notice icon="alert-circle-outline" title="No questions" text="This level has no questions yet." />
    );
  } else {
    body = null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <Header title={title || "Assessment"} onBack={goBack} />
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  noticeTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  noticeText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  link: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  lessonTitle: { fontSize: 20, fontWeight: "800" },
  description: { fontSize: 15, lineHeight: 22 },
  summary: { borderWidth: 1, borderRadius: 12, padding: 12 },
  summaryText: { fontSize: 14, fontWeight: "600" },
  primaryBtn: { minHeight: 50, paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  progressWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 12 },
  prompt: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  choice: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 12 },
  letter: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  letterText: { fontWeight: "800", fontSize: 14 },
  choiceText: { flex: 1, fontSize: 16 },
  errorText: { fontSize: 13 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderTopWidth: 1 },
  navBtn: { minHeight: 50, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  navText: { fontWeight: "700", fontSize: 15 },
});