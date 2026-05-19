// web/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Core Fetcher ─────────────────────────────────────────────────────────────

interface ApiFetchOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('token') ?? localStorage.getItem('accessToken'))
      : null;

  const { headers: extraHeaders, skipAuthRedirect, ...restOptions } = options ?? {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((extraHeaders as Record<string, string> | undefined) ?? {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

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
              return apiFetch<T>(path, { ...options, skipAuthRedirect: true });
            }
          } catch {
            // Refresh request itself failed — fall through to logout
          }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login?reason=expired';

        return new Promise<never>(() => {});
      }

      throw new Error(combined || 'Unauthorized');
    }

    throw new Error(combined || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id:                  string;
  username:            string;
  firstName:           string;
  lastName:            string;
  email?:              string;
  rfidCard?:           string | null;
  phoneNumber?:        string | null;
  gradeLevel?:         string | null;
  role:                'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  mustChangePassword?: boolean;
  createdAt:           string;
}

export interface CreateUserDto {
  username:     string;
  firstName:    string;
  lastName:     string;
  email?:       string;
  password?:    string;
  rfidCard?:    string;
  phoneNumber?: string;
  gradeLevel?:  string;
  role:         'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
}

export interface UserStats {
  admins: number; teachers: number; students: number;
  parents: number; total: number;
}

export interface AuthUser {
  id:                  string;
  username:            string;
  role:                string;
  firstName:           string;
  lastName:            string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  user:         AuthUser;
}

export interface AttendanceRecord {
  id:        string;
  studentId: string;
  status:    string | null;
  timeIn?:   string | null;
  timeOut?:  string | null;
  date:      string;
}

// ── Filtered attendance record — includes joined student data ─────────────────
export interface FilteredAttendanceRecord {
  id:        string;
  studentId: string;
  date:      string;
  timeIn:    string | null;
  timeOut:   string | null;
  status:    string | null;
  student: {
    id:         string;
    firstName:  string;
    lastName:   string;
    gradeLevel: string | null;
  };
}

export interface AttendanceQueryParams {
  studentId?:  string;
  date?:       string;
  dateFrom?:   string;
  dateTo?:     string;
  status?:     string;
  gradeLevel?: string;
  page?:       number;
  limit?:      number;
}

export interface PaginatedAttendance {
  data:       FilteredAttendanceRecord[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
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
    timeIn:  string | null;
    timeOut: string | null;
    status:  string;
  };
}

export interface ParentInfo {
  id: string; firstName: string; lastName: string;
}

export interface ChildInfo {
  id:         string;
  firstName:  string;
  lastName:   string;
  gradeLevel: string | null;
  rfidCard:   string | null;
  photoUrl:   string | null;
}

// ─── Password Reset Types ─────────────────────────────────────────────────────

export interface PasswordResetRequest {
  id:                 string;
  username:           string;
  userId:             string;
  status:             'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt:        string;
  resolvedAt?:        string | null;
  resolvedBy?:        string | null;
  generatedPassword?: string | null;
  user?: {
    firstName: string;
    lastName:  string;
    role:      string;
  } | null;
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
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }
  return res;
};

export const getMe = () => apiFetch<User>('/auth/me');

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = () => {
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUserId = userData ? JSON.parse(userData).id : '';
  return apiFetch<User[]>(`/users?excludeId=${currentUserId}`);
};

export const getUserStats  = () => apiFetch<UserStats>('/users/stats');
export const getUserById   = (id: string) => apiFetch<User>(`/users/${id}`);

export const createUser = (data: CreateUserDto) =>
  apiFetch<{
    user: User;
    generatedPassword: string;
    parentAccount?: { username: string; generatedPassword: string };
  }>('/users', { method: 'POST', body: JSON.stringify(data) });

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

export const forceChangePassword = (userId: string, newPassword: string) =>
  apiFetch<{ message: string }>(`/users/${userId}/force-change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });

export const getStudentParent  = (studentId: string) =>
  apiFetch<ParentInfo | null>(`/users/student-parent/${studentId}`);

export const getParentChildren = (parentId: string) =>
  apiFetch<ChildInfo[]>(`/users/my-children/${parentId}`);

// ─── Attendance ───────────────────────────────────────────────────────────────

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

export const getFilteredAttendance = (params: AttendanceQueryParams) => {
  const q = new URLSearchParams();
  if (params.studentId)  q.set('studentId',  params.studentId);
  if (params.date)       q.set('date',       params.date);
  if (params.dateFrom)   q.set('dateFrom',   params.dateFrom);
  if (params.dateTo)     q.set('dateTo',     params.dateTo);
  if (params.status)     q.set('status',     params.status);
  if (params.gradeLevel) q.set('gradeLevel', params.gradeLevel);
  if (params.page)       q.set('page',       String(params.page));
  if (params.limit)      q.set('limit',      String(params.limit));
  return apiFetch<PaginatedAttendance>(`/attendance?${q.toString()}`);
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationRecord {
  id:      string;
  userId:  string;
  type:    'ANNOUNCEMENT' | 'ATTENDANCE' | 'FSL' | 'SYSTEM';
  message: string;
  sentAt:  string;
  status:  'UNREAD' | 'READ';
}

export const getMyNotifications      = () =>
  apiFetch<NotificationRecord[]>('/notifications/my-notifications');

export const getUnreadNotifications  = () =>
  apiFetch<NotificationRecord[]>('/notifications/unread');

export const markAllNotificationsRead = () =>
  apiFetch<void>('/notifications/mark-all-read', { method: 'PATCH' });

export const markNotificationRead = (id: string) =>
  apiFetch<NotificationRecord>(`/notifications/${id}/read`, { method: 'PATCH' });

export const registerPushToken = (token: string) =>
  apiFetch<void>('/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

// ─── Config ───────────────────────────────────────────────────────────────────

export interface AppConfigItem {
  id:        string;
  key:       string;
  value:     string;
  label:     string;
  group:     string;
  sortOrder: number;
}

export const getAppConfig = () => apiFetch<AppConfigItem[]>('/config');

// ─── Password Reset ───────────────────────────────────────────────────────────

export const requestPasswordReset = (username: string) =>
  apiFetch<{ message: string }>('/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ username }),
    skipAuthRedirect: true,
  });

export const getPendingResetCount = () =>
  apiFetch<{ count: number }>('/password-reset/requests/pending-count');

export const getAllResetRequests = () =>
  apiFetch<PasswordResetRequest[]>('/password-reset/requests');

export const approveResetRequest = (id: string) =>
  apiFetch<{ message: string; username: string; generatedPassword: string }>(
    `/password-reset/requests/${id}/approve`,
    { method: 'POST' },
  );

export const rejectResetRequest = (id: string) =>
  apiFetch<{ message: string }>(`/password-reset/requests/${id}/reject`, {
    method: 'POST',
  });

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login,
  getMe,

  // Users
  getUsers:              getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  forceChangePassword,
  getStudentParent,
  getParentChildren,

  // Attendance
  handleRfidTap,
  rfidTap:               handleRfidTap,
  getStudentAttendance,
  getStudentStats,
  getTodayAttendance,
  getFilteredAttendance,                // ← new

  // Notifications
  getMyNotifications,
  getUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,

  // Config
  getAppConfig,

  // Password Reset
  requestPasswordReset,
  getPendingResetCount,
  getAllResetRequests,
  approveResetRequest,
  rejectResetRequest,
};