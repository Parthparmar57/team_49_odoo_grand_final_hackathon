// --- PEOPLEPAY360 API CLIENT ---
import {
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AdminCreateUserPayload,
  AuthResponse,
  User,
  EmployeeSummary,
} from '../types/auth';

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private tokenKey = 'peoplepay360_access_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Failed to communicate with backend server',
        },
      };
    }
  }

  // --- HEALTH & STATUS ---
  async checkHealth(): Promise<ApiResponse<{ server: string; database: string }>> {
    return this.request('/health');
  }

  // --- AUTHENTICATION ---
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

  // --- ADMIN & USER MANAGEMENT ---
  async adminCreateUser(payload: AdminCreateUserPayload): Promise<ApiResponse<{ user: User; tempPassword?: string; message: string }>> {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/auth/users');
  }

  async getEmployees(): Promise<ApiResponse<EmployeeSummary[]>> {
    return this.request<EmployeeSummary[]>('/employees');
  }

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

  // --- LEAVE & TIME OFF ---
  async getTimeOffRequests(): Promise<ApiResponse<any>> {
    return this.request('/time-off/requests');
  }

  async getTimeOffTypes(): Promise<ApiResponse<any>> {
    return this.request('/time-off/types');
  }

  async createLeaveRequest(payload: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/time-off/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- DASHBOARD METRICS ---
  async getDashboardOverview(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/overview');
  }
}

export const apiClient = new ApiClient();
