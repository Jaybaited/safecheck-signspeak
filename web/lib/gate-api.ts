// web/lib/gate-api.ts
import { apiFetch } from './api';

export type GateState = 'NOT_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_TAP_OUT';
export type GateReason = 'FORGOT_CARD' | 'CARD_LOST' | 'CARD_NOT_WORKING' | 'OTHER';

export interface GateStudent {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  cardLast4: string | null;
  cardStatus: 'ACTIVE' | 'SUSPENDED' | 'LOST' | null;
  hasPhoto: boolean;
  state: GateState;
  timeIn: string | null;
  timeOut: string | null;
  late: boolean;
  manual: boolean;
}

export interface GateBoard {
  date: string;
  totals: { students: number; inSchool: number; checkedOut: number; notIn: number };
  data: GateStudent[];
}

export type GateFilter = 'ALL' | 'IN_SCHOOL' | 'CHECKED_OUT' | 'NOT_IN';

export const getGateBoard = (q: string, status: GateFilter) => {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (status !== 'ALL') p.set('status', status);
  const qs = p.toString();
  return apiFetch<GateBoard>('/attendance/gate/today' + (qs ? '?' + qs : ''));
};

export const getGatePhoto = (studentId: string) =>
  apiFetch<{ url: string | null }>('/attendance/gate/photo/' + studentId);

export const markGate = (body: {
  studentId: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  reason: GateReason;
  note?: string;
}) =>
  apiFetch<{ success: boolean; message: string }>('/attendance/gate/mark', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export interface GateRecentRow {
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  timeIn: string | null;
  timeOut: string | null;
  status: string | null;
  noTapOut: boolean;
  manual: boolean;
}

export const getGateRecent = (limit = 30) =>
  apiFetch<{ rows: GateRecentRow[] }>('/attendance/gate/recent?limit=' + limit);
