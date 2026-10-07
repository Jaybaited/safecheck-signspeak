// web/lib/calendar-api.ts
import { apiFetch } from './api';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  createdAt: string;
}

export const getHolidays = (from?: string, to?: string) => {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return apiFetch<Holiday[]>('/calendar/holidays' + (qs ? '?' + qs : ''));
};

export const addHoliday = (date: string, name: string) =>
  apiFetch<Holiday>('/calendar/holidays', { method: 'POST', body: JSON.stringify({ date, name }) });

export const deleteHoliday = (id: string) =>
  apiFetch<{ success: boolean }>('/calendar/holidays/' + id, { method: 'DELETE' });