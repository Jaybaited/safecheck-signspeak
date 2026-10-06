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