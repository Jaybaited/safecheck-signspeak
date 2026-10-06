// web/lib/assessments-api.ts
import { apiFetch } from './api';

export type LevelState =
  | 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'FAILED' | 'PASSED';

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

export interface AttemptSummary {
  id: string;
  assessmentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  score: number | null;
  passed: boolean | null;
}

export interface AttemptDetail extends AttemptSummary {
  assessment: { id: string; title: string; level: number | null; passMark: number };
  responses: { id: string; questionId: string; submittedSign: string | null; isCorrect: boolean | null }[];
}

export const getMyLevels = () => apiFetch<LevelCard[]>('/assessments/levels/me');

export const getAssessment = (id: string) => apiFetch<AssessmentDetail>(`/assessments/${id}`);

export const startAssessmentAttempt = (id: string) =>
  apiFetch<AttemptSummary>(`/assessments/${id}/attempts`, { method: 'POST' });

export const saveAssessmentAnswer = (attemptId: string, questionId: string, submittedSign: string) =>
  apiFetch<{ id: string; questionId: string; submittedSign: string | null }>(
    `/assessments/attempts/${attemptId}/responses`,
    { method: 'POST', body: JSON.stringify({ questionId, submittedSign }) },
  );

export const completeAssessmentAttempt = (attemptId: string) =>
  apiFetch<AttemptSummary>(`/assessments/attempts/${attemptId}/complete`, { method: 'PATCH' });

export const getAssessmentAttempt = (attemptId: string) =>
  apiFetch<AttemptDetail>(`/assessments/attempts/${attemptId}`);
// ── Admin: review results ─────────────────────────────────────────────────────

export interface AdminAttemptRow {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  user: { id: string; firstName: string; lastName: string; gradeLevel: string | null };
  assessment: { id: string; title: string; level: number | null; passMark: number };
}

export interface AdminAttemptDetail {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  user: { id: string; firstName: string; lastName: string; username: string; gradeLevel: string | null };
  responses: { id: string; questionId: string; submittedSign: string | null; isCorrect: boolean | null }[];
  assessment: {
    id: string;
    title: string;
    level: number | null;
    passMark: number;
    questions: {
      id: string;
      order: number;
      prompt: string;
      choices: Record<string, string> | null;
      correctAnswer: string | null;
    }[];
  };
}

export const getAdminAttempts = (status?: string) =>
  apiFetch<AdminAttemptRow[]>(
    status ? `/assessments/attempts?status=${encodeURIComponent(status)}` : '/assessments/attempts',
  );

export const getAdminAttempt = (attemptId: string) =>
  apiFetch<AdminAttemptDetail>(`/assessments/attempts/${attemptId}/admin`);

export const reviewAttempt = (attemptId: string, score?: number) =>
  apiFetch<AdminAttemptDetail>(`/assessments/attempts/${attemptId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(score === undefined ? {} : { score }),
  });