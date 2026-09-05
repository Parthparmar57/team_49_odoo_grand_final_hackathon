// --- PEOPLEPAY360 COMPREHENSIVE API CLIENT ---
import {
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AdminCreateUserPayload,
  AuthResponse,
  User,
} from '../types/auth';

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  pagination?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

type RequestOptions = RequestInit & { params?: Record<string, string> };

class ApiClient {
  private tokenKey = 'pp360_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    let url = `${API_BASE_URL}${endpoint}`;
    if (options.params) {
      const q = new URLSearchParams(options.params).toString();
      if (q) url += `?${q}`;
    }

    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const { params: _, ...fetchOptions } = options;
      const response = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      return { success: false, error: { code: 'NETWORK_ERROR', message: err?.message || 'Network error' } };
    }
  }

  // --- AUTHENTICATION & USER METHODS ---
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.removeToken();
    return response;
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<{ message: string; resetToken?: string }>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adminCreateUser(payload: AdminCreateUserPayload): Promise<ApiResponse<{ user: User; tempPassword?: string; message: string }>> {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/auth/users');
  }

  async getEmployees(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/employees');
  }

  async getDashboardOverview(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/overview');
  }

  async checkHealth(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }

  auth = {
    login: (email: string, password: string) => this.login({ email, password }),
    register: (data: any) => this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    profile: () => this.getMe(),
  };

  // --- EMPLOYEES ---
  employees = {
    list: (params?: Record<string, string>) => this.request('/employees', { params }),
    get: (id: string) => this.request(`/employees/${id}`),
    create: (data: any) => this.request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => this.request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/employees/${id}`, { method: 'DELETE' }),
  };

  // --- DEPARTMENTS ---
  departments = {
    list: () => this.request('/departments'),
    create: (data: any) => this.request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => this.request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/departments/${id}`, { method: 'DELETE' }),
  };

  // --- CONTRACTS ---
  contracts = {
    list: (params?: Record<string, string>) => this.request('/contracts', { params }),
    get: (id: string) => this.request(`/contracts/${id}`),
    create: (data: any) => this.request('/contracts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => this.request(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/contracts/${id}`, { method: 'DELETE' }),
  };

  // --- SCHEDULES ---
  schedules = {
    list: () => this.request('/schedules'),
    get: (id: string) => this.request(`/schedules/${id}`),
    create: (data: any) => this.request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => this.request(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/schedules/${id}`, { method: 'DELETE' }),
  };

  // --- ATTENDANCE ---
  attendance = {
    list: (params?: Record<string, string>) => this.request('/attendance', { params }),
    checkIn: (data?: any) => this.request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data || {}) }),
    checkOut: (data?: any) => this.request('/attendance/check-out', { method: 'POST', body: JSON.stringify(data || {}) }),
    correct: (id: string, data: any) => this.request(`/attendance/${id}/correct`, { method: 'PATCH', body: JSON.stringify(data) }),
  };

  // --- TIME OFF ---
  timeOff = {
    types: () => this.request('/time-off/types'),
    allocations: () => this.request('/time-off/allocations'),
    requests: (params?: Record<string, string>) => this.request('/time-off/requests', { params }),
    createRequest: (data: any) => this.request('/time-off/requests', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string) => this.request(`/time-off/requests/${id}/approve`, { method: 'PATCH' }),
    refuse: (id: string, reason?: string) => this.request(`/time-off/requests/${id}/refuse`, { method: 'PATCH', body: JSON.stringify({ rejectionReason: reason }) }),
  };

  // --- PAYROLL ---
  payroll = {
    structures: () => this.request('/payroll/structures'),
    createStructure: (data: any) => this.request('/payroll/structures', { method: 'POST', body: JSON.stringify(data) }),
    payruns: () => this.request('/payroll/payruns'),
    createPayrun: (data: any) => this.request('/payroll/payruns', { method: 'POST', body: JSON.stringify(data) }),
    getPayrun: (id: string) => this.request(`/payroll/payruns/${id}`),
    computePayrun: (id: string) => this.request(`/payroll/payruns/${id}/compute`, { method: 'POST' }),
    validatePayrun: (id: string) => this.request(`/payroll/payruns/${id}/validate`, { method: 'POST' }),
    markPaid: (id: string) => this.request(`/payroll/payruns/${id}/pay`, { method: 'POST' }),
    payslips: (params?: Record<string, string>) => this.request('/payroll/payslips', { params }),
    getPayslip: (id: string) => this.request(`/payroll/payslips/${id}`),
  };

  // --- INBOUND EMAIL AI PROCESSING ---
  async sendInboundEmail(emailData: {
    senderEmail: string;
    subject: string;
    body: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/email/inbound', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // --- DASHBOARD ---
  dashboard = {
    overview: () => this.getDashboardOverview(),
  };

  // --- HEALTH ---
  health = () => this.checkHealth();
}

export const api = new ApiClient();
export const apiClient = api;
export default api;
