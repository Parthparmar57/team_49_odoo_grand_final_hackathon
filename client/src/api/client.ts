// --- PEOPLEPAY360 API CLIENT ---
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
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

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
