const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email?: string;
  password: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  rfidCard?: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timeIn: string;
  timeOut: string | null;
  date: string;
}

export interface AttendanceStats {
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

export interface RfidTapResponse {
  success: boolean;
  action: 'CHECK_IN' | 'CHECK_OUT';
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
  attendance: {
    timeIn: string;
    timeOut: string | null;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats() {
    return this.request<{
      admins: number;
      teachers: number;
      students: number;
      parents: number;
      total: number;
    }>('/users/stats');
  }

  // Attendance
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    return this.request<AttendanceRecord[]>(
      `/attendance/student/${studentId}`
    );
  }

  async getStudentStats(studentId: string): Promise<AttendanceStats> {
    return this.request<AttendanceStats>(
      `/attendance/student/${studentId}/stats`
    );
  }

  async getTodayAttendance(
    studentId: string
  ): Promise<AttendanceRecord | null> {
    return this.request<AttendanceRecord | null>(
      `/attendance/student/${studentId}/today`
    );
  }

  // RFID
  async rfidTap(rfidCard: string): Promise<RfidTapResponse> {
    return this.request<RfidTapResponse>('/attendance/rfid-tap', {
      method: 'POST',
      body: JSON.stringify({ rfidCard }),
    });
  }
}

export const api = new ApiClient();
