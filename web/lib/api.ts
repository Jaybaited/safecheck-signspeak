// web/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Core Fetcher ─────────────────────────────────────────────────────────────

interface ApiFetchOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const { headers: extraHeaders, skipAuthRedirect, ...restOptions } = options ?? {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((extraHeaders as Record<string, string> | undefined) ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const raw = Array.isArray(error?.message)
      ? error.message.join(', ')
      : typeof error?.message === 'string'
      ? error.message
      : '';
    const meta = error?.meta?.message ?? error?.meta?.target ?? '';
    const combined = [raw, meta].filter(Boolean).join(' ');

    if (res.status === 401) {
  if (!skipAuthRedirect && typeof window !== 'undefined') {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (storedRefresh) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          localStorage.setItem('token', accessToken);
          // retry original request with new token
          return apiFetch<T>(path, options);
        }
      } catch {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login?reason=expired';
  }
  throw new Error(combined || 'Unauthorized');
}

    throw new Error(combined || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id:          string;
  username:    string;
  firstName:   string;
  lastName:    string;
  email?:      string;
  rfidCard?:   string | null;
  gradeLevel?: string | null;
  role:        'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  createdAt:   string;
}

export interface CreateUserDto {
  username:    string;
  firstName:   string;
  lastName:    string;
  email?:      string;
  password:    string;
  rfidCard?:   string;
  gradeLevel?: string;
  role:        'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
}

export interface UserStats {
  admins: number; teachers: number; students: number;
  parents: number; total: number;
}

export interface AuthUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  user:         AuthUser;
}

export interface AttendanceRecord {
  id:       string;
  studentId: string;
  status:   'PRESENT' | 'ABSENT' | 'LATE'; // ✅ status included
  timeIn?:  string | null;  // UTC ISO string from server
  timeOut?: string | null;  // UTC ISO string from server
  date:     string;
}

export interface AttendanceStats {
  totalDays: number; present: number; absent: number;
  late: number; attendanceRate: number;
}

export interface RfidTapResponse {
  success: boolean;
  action:  'CHECK_IN' | 'CHECK_OUT';
  student: {
    firstName:  string;
    lastName:   string;
    gradeLevel: string | null;
  };
  attendance: {
    timeIn:  string | null;  // UTC ISO string — format for display on frontend only
    timeOut: string | null;  // UTC ISO string — format for display on frontend only
    status:  string;
  };
}

export interface ParentInfo {
  id: string; firstName: string; lastName: string;
}

export interface ChildInfo {
  id: string; firstName: string; lastName: string;
  gradeLevel: string | null; rfidCard: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (username: string, password: string) => {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuthRedirect: true,
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }
  return res;
};

export const getMe = () => apiFetch<User>('/auth/me');

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers  = () => apiFetch<User[]>('/users');
export const getUserStats = () => apiFetch<UserStats>('/users/stats');
export const getUserById  = (id: string) => apiFetch<User>(`/users/${id}`);

export const createUser = (data: CreateUserDto) =>
  apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(data) });

export const updateUser = (id: string, data: Partial<CreateUserDto>) =>
  apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteUser = (id: string) =>
  apiFetch<void>(`/users/${id}`, { method: 'DELETE' });

export const changePassword = (
  userId: string,
  currentPassword: string,
  newPassword: string,
) =>
  apiFetch<{ message: string }>(`/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const getStudentParent  = (studentId: string) =>
  apiFetch<ParentInfo | null>(`/users/student-parent/${studentId}`);

export const getParentChildren = (parentId: string) =>
  apiFetch<ChildInfo[]>(`/users/my-children/${parentId}`);

// ─── Attendance ───────────────────────────────────────────────────────────────

// ✅ Only sends rfidCard — NO client-side timestamp whatsoever
export const handleRfidTap = (rfidCard: string) =>
  apiFetch<RfidTapResponse>('/attendance/rfid-tap', {
    method: 'POST',
    body: JSON.stringify({ rfidCard }),
  });

export const getStudentAttendance = (studentId: string) =>
  apiFetch<AttendanceRecord[]>(`/attendance/student/${studentId}`);

export const getStudentStats = (studentId: string) =>
  apiFetch<AttendanceStats>(`/attendance/student/${studentId}/stats`);

export const getTodayAttendance = (studentId: string) =>
  apiFetch<AttendanceRecord | null>(`/attendance/student/${studentId}/today`);

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  login, getMe,
  getUsers: getAllUsers, getUserStats, getUserById,
  createUser, updateUser, deleteUser,
  changePassword,
  getStudentParent,
  getParentChildren,
  handleRfidTap,
  rfidTap: handleRfidTap,
  getStudentAttendance, getStudentStats, getTodayAttendance,
};