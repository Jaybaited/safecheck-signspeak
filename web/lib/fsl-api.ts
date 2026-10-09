// web/lib/fsl-api.ts
import { apiFetch } from './api';
import { studentStorage } from './storage';

export type FslStatus = 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface FslLetterProgress {
  word: string;
  status: FslStatus;
  attempts: number;
  accuracy: number;
  lastPracticed: string | null;
}

export interface FslProgress {
  studentId: string;
  totalLetters: number;
  masteredCount: number;
  percent: number;
  letters: FslLetterProgress[];
  daily: { date: string; count: number }[];
  weekTotal: number;
  highScore: number;
  lastPracticed: string | null;
}

export interface FslOverviewRow {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  totalLetters: number;
  masteredCount: number;
  percent: number;
  lastPracticed: string | null;
  weekCount: number;
  highScore: number;
}

function post<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export const getMyFslProgress = () => apiFetch<FslProgress>('/fsl/progress/me');

export const getStudentFslProgress = (studentId: string) =>
  apiFetch<FslProgress>(`/fsl/progress/student/${studentId}`);

export const getFslOverview = () => apiFetch<FslOverviewRow[]>('/fsl/overview');

export const recordFslSign = (
  word: string,
  confidence: number,
  source: 'PRACTICE' | 'GAME' = 'PRACTICE',
) =>
  post<{ word: string; status: FslStatus; attempts: number; accuracy: number; newlyMastered: boolean }>(
    '/fsl/progress',
    { word, confidence, source },
  );

export const recordFslGame = (mode: 'SPEED' | 'STREAK', score: number, lettersCount: number) =>
  post<{ score: number; best: number; isNewBest: boolean }>('/fsl/games', { mode, score, lettersCount });

export const importLocalFsl = (letters: string[], highScore?: number) =>
  post<{ imported: number; highScoreImported: boolean }>('/fsl/import', { letters, highScore });

// Moves progress that older versions kept in this browser to the server, once per student.
export async function importLocalFslOnce(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (studentStorage.get(userId, 'fsl_imported')) return;
  try {
    const raw = studentStorage.get(userId, 'fsl_completed');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const letters = Array.isArray(parsed)
      ? parsed.filter((l): l is string => typeof l === 'string')
      : [];
    const hs = Math.min(parseInt(studentStorage.get(userId, 'fsl_highscore') ?? '0', 10) || 0, 1000000);
    await importLocalFsl(letters, hs);
    studentStorage.set(userId, 'fsl_imported', '1');
  } catch {
    // try again on the next visit
  }
}