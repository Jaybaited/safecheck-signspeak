// lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Core Fetcher ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const { headers: extraHeaders, ...restOptions } = options ?? {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders as Record<string, string> | undefined ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || `Request failed: ${res.status}`);
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
  admins:   number;
  teachers: number;
  students: number;
  parents:  number;
  total:    number;
}

export interface AuthUser {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}

export interface LoginResponse {
  accessToken: string;
  user:        AuthUser;
}

export interface AttendanceRecord {
  id:        string;
  studentId: string;
  status:    'PRESENT' | 'ABSENT' | 'LATE';
  timeIn?:   string | null;
  timeOut?:  string | null;
  date:      string;
}

export interface AttendanceStats {
  totalDays:      number;
  present:        number;
  absent:         number;
  late:           number;
  attendanceRate: number;
}

export interface RfidTapResponse {
  success:     boolean;
  message:     string;
  action:      'CHECK_IN' | 'CHECK_OUT'; // ✅ was missing
  student?:    User;
  attendance?: AttendanceRecord;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ username, password }),
  });

// ✅ New: fetches fresh user data from DB using the stored JWT
export const getMe = () =>
  apiFetch<User>('/auth/me');

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = () =>
  apiFetch<User[]>('/users');

export const getUserStats = () =>
  apiFetch<UserStats>('/users/stats');

export const getUserById = (id: string) =>
  apiFetch<User>(`/users/${id}`);

export const createUser = (data: CreateUserDto) =>
  apiFetch<User>('/users', {
    method: 'POST',
    body:   JSON.stringify(data),
  });

export const updateUser = (id: string, data: Partial<CreateUserDto>) =>
  apiFetch<User>(`/users/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });

export const deleteUser = (id: string) =>
  apiFetch<void>(`/users/${id}`, { method: 'DELETE' });

// ─── Attendance ───────────────────────────────────────────────────────────────

export const handleRfidTap = (rfidCard: string) =>
  apiFetch<RfidTapResponse>('/attendance/rfid-tap', {
    method: 'POST',
    body:   JSON.stringify({ rfidCard }),
  });

export const getStudentAttendance = (studentId: string) =>
  apiFetch<AttendanceRecord[]>(`/attendance/student/${studentId}`);

export const getStudentStats = (studentId: string) =>
  apiFetch<AttendanceStats>(`/attendance/student/${studentId}/stats`);

export const getTodayAttendance = (studentId: string) =>
  apiFetch<AttendanceRecord | null>(`/attendance/student/${studentId}/today`);

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  login,
  getMe,                          // ✅ added
  getUsers:             getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  handleRfidTap,
  rfidTap:              handleRfidTap, // ✅ alias for rfid-portal page
  getStudentAttendance,
  getStudentStats,
  getTodayAttendance,
};