/**
 * Enterprise Security API Client for Mr. DIVA LMS (Fase 1.1 & Fase 2 Storage + PWA)
 * Synchronizes client state with the server-side truth, enforces session & CSRF tokens,
 * and handles server-evaluated exams, role authorization, and isolated binary file storage.
 */

const TOKEN_KEY = 'mrdiva_session_token';
const CSRF_KEY = 'mrdiva_csrf_token';

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getCsrfToken(): string | null {
    return localStorage.getItem(CSRF_KEY);
  },

  setCsrfToken(csrfToken: string) {
    localStorage.setItem(CSRF_KEY, csrfToken);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CSRF_KEY);
  },

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (csrfToken && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error: any = new Error(data.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      error.data = data;
      throw error;
    }

    if (data && typeof data.csrfToken === 'string') {
      this.setCsrfToken(data.csrfToken);
    }

    return data;
  },

  // Auth Endpoints
  async login(username?: string, password?: string, roleDemo?: string, demoUserId?: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, roleDemo, demoUserId }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    if (res.csrfToken) {
      this.setCsrfToken(res.csrfToken);
    }
    return res;
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.clearToken();
    }
  },

  // Exams (Server-Evaluated & Answer Keys Redacted for Students)
  async getExams() {
    return this.request('/api/exams');
  },

  async getExam(id: string) {
    return this.request(`/api/exams/${id}`);
  },

  async createExam(examData: any) {
    return this.request('/api/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  async submitExam(examId: string, answers: Record<string, string>, timeSpentSeconds: number, clientProvidedScore?: number) {
    return this.request(`/api/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpentSeconds, clientProvidedScore }),
    });
  },

  // Tasks & Submissions
  async getTasks() {
    return this.request('/api/tasks');
  },

  async createTask(taskData: any) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async deleteTask(taskId: string) {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async submitTask(taskId: string, submissionText: string, fileAttachment?: string, fileObjectId?: string) {
    return this.request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionText, fileAttachment, fileObjectId }),
    });
  },

  async gradeTask(submissionId: string, score: number, feedback: string) {
    return this.request(`/api/tasks/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ score, feedback }),
    });
  },

  // Fase 2: Isolated Binary File Storage Endpoints
  async getStorageInfo() {
    return this.request('/api/storage/info');
  },

  async uploadTaskFile(params: {
    fileName: string;
    mimeType: string;
    base64Data: string;
    taskId?: string;
  }) {
    return this.request('/api/storage/upload', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async downloadStoredFileBlob(fileId: string): Promise<{ blob: Blob; contentType: string }> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/storage/files/${encodeURIComponent(fileId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const error: any = new Error(errData.error || `Gagal mengakses berkas (HTTP ${response.status})`);
      error.status = response.status;
      error.code = errData.code;
      throw error;
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, contentType };
  },

  // Fase 2: Web Push & Notification Architecture Endpoints
  async getNotificationStatus() {
    return this.request('/api/notifications/status');
  },

  async subscribePush(subscriptionPayload: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }) {
    return this.request('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscriptionPayload),
    });
  },

  async unsubscribePush(endpoint?: string) {
    return this.request('/api/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  },

  // Attendance
  async getAttendance() {
    return this.request('/api/attendance');
  },

  async submitAttendance(classId: string, className: string, date: string, students: any[]) {
    return this.request('/api/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ classId, className, date, students }),
    });
  },

  async submitDailyAttendanceRecords(records: any[]) {
    return this.request('/api/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Admin & School Entities
  async getAdminOverview() {
    return this.request('/api/admin/overview');
  },

  async getUsers() {
    return this.request('/api/admin/users');
  },

  async createUser(userData: any) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getClasses() {
    return this.request('/api/admin/classes');
  },

  async createClass(classData: any) {
    return this.request('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  // Security Penetration Tests (14 Vectors: Fase 1.1 + Fase 2)
  async runSecurityAudit() {
    return this.request('/api/security/run-audit', {
      method: 'POST',
    });
  },
};
