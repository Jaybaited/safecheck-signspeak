// web/lib/admin-log-api.ts
import { apiFetch } from './api';

export interface AdminLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  details: unknown;
  createdAt: string;
}

export interface AdminLogResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  actions: string[];
  admins: { id: string; name: string }[];
  data: AdminLogEntry[];
}

export interface AdminLogFilters {
  adminId?: string;
  action?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const getAdminLog = (f: AdminLogFilters) => {
  const params = new URLSearchParams();
  (Object.keys(f) as (keyof AdminLogFilters)[]).forEach((k) => {
    const v = f[k];
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return apiFetch<AdminLogResponse>('/admin-log' + (qs ? '?' + qs : ''));
};