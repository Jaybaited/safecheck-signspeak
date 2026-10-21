// web/lib/school-year-api.ts
import { apiFetch } from './api';

export interface SchoolYear {
  name: string;
  start: string;
  end: string;
}

export const getSchoolYear = async (): Promise<SchoolYear | null> => {
  const rows = await apiFetch<{ key: string; value: string }[]>('/config?group=school_year');
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? '';
  const name = get('school_year');
  if (!name) return null;
  return { name, start: get('school_year_start'), end: get('school_year_end') };
};

export const saveSchoolYear = (body: SchoolYear) =>
  apiFetch<{ message: string; name: string }>('/config/school-year', {
    method: 'PUT',
    body: JSON.stringify(body),
  });