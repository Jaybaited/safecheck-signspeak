import { api } from "./api";

export type LevelState =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "AWAITING_REVIEW"
  | "FAILED"
  | "PASSED";

export interface LevelCard {
  id: string;
  title: string;
  level: number;
  passMark: number;
  questionCount: number;
  lessonVideoUrl: string | null;
  lessonDescription: string | null;
  state: LevelState;
  attemptId: string | null;
  score: number | null;
  passed: boolean | null;
}

export interface AssessmentQuestion {
  id: string;
  order: number;
  prompt: string;
  mediaUrl: string | null;
  captionUrl: string | null;
  choices: Record<string, string> | null;
}

export interface AssessmentDetail {
  id: string;
  title: string;
  level: number | null;
  passMark: number;
  lessonVideoUrl: string | null;
  lessonDescription: string | null;
  questions: AssessmentQuestion[];
}

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface AttemptSummary {
  id: string;
  assessmentId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  score: number | null;
  passed: boolean | null;
}

export interface AttemptResponse {
  id: string;
  questionId: string;
  submittedSign: string | null;
  isCorrect: boolean | null;
}

export interface AttemptDetail extends AttemptSummary {
  assessment: { id: string; title: string; level: number | null; passMark: number };
  responses: AttemptResponse[];
}

export interface SavedAnswer {
  id: string;
  questionId: string;
  submittedSign: string | null;
}

export const getMyLevels = async (): Promise<LevelCard[]> =>
  (await api.get<LevelCard[]>("/assessments/levels/me")).data;

export const getAssessment = async (id: string): Promise<AssessmentDetail> =>
  (await api.get<AssessmentDetail>(`/assessments/${id}`)).data;

export const startAssessmentAttempt = async (id: string): Promise<AttemptSummary> =>
  (await api.post<AttemptSummary>(`/assessments/${id}/attempts`)).data;

export const saveAssessmentAnswer = async (
  attemptId: string,
  questionId: string,
  submittedSign: string,
): Promise<SavedAnswer> =>
  (
    await api.post<SavedAnswer>(`/assessments/attempts/${attemptId}/responses`, {
      questionId,
      submittedSign,
    })
  ).data;

export const completeAssessmentAttempt = async (attemptId: string): Promise<AttemptSummary> =>
  (await api.patch<AttemptSummary>(`/assessments/attempts/${attemptId}/complete`)).data;

export const getAssessmentAttempt = async (attemptId: string): Promise<AttemptDetail> =>
  (await api.get<AttemptDetail>(`/assessments/attempts/${attemptId}`)).data;

// ── Error helpers ────────────────────────────────────────────────────────────

export const getErrorStatus = (err: unknown): number | undefined =>
  (err as any)?.response?.status;

// Backend blocks every route with 403 + this code until the password is changed.
export const isPasswordChangeRequired = (err: unknown): boolean =>
  getErrorStatus(err) === 403 && (err as any)?.response?.data?.code === "PASSWORD_CHANGE_REQUIRED";

export const getApiErrorMessage = (
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  const e = err as any;
  const raw = e?.response?.data?.message;
  if (Array.isArray(raw) && raw.length) return raw.join(", ");
  if (typeof raw === "string" && raw) return raw;
  if (e?.code === "ERR_NETWORK" || e?.message === "Network Error") {
    return "Cannot reach the server. Check your Wi-Fi and try again.";
  }
  return typeof e?.message === "string" && e.message ? e.message : fallback;
};