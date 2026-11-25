import {
  AuthResponse,
  User,
  ComplaintDetail,
  ComplaintListResponse,
  Department,
  DepartmentRecommendation,
  Authority,
  AnalyticsOverview,
  AuditLogListResponse,
  NotificationItem,
  ExternalSubmission
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('civictrack_token');
}

export function setToken(token: string): void {
  localStorage.setItem('civictrack_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('civictrack_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, token expired or invalid
    removeToken();
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((e: any) => e.msg).join(', ');
        } else {
          errorDetail = errorJson.detail;
        }
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (payload: { email: string; full_name: string; password: string; phone_number?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request<User>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  getProfile: () => request<{ user: User; stats: { total_complaints: number; resolved_complaints: number; in_progress_complaints: number; open_complaints: number } }>('/users/profile'),

  updateProfile: (payload: { full_name?: string; phone_number?: string; password?: string }) =>
    request<User>('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Departments
  getDepartments: (isActive?: boolean) => {
    const q = isActive !== undefined ? `?is_active=${isActive}` : '';
    return request<Department[]>(`/departments${q}`);
  },

  recommendDepartment: (category: string, context?: string) => {
    const params = new URLSearchParams({ category });
    if (context) params.append('context', context);
    return request<DepartmentRecommendation>(`/departments/recommend?${params.toString()}`);
  },

  // Complaints
  createComplaint: (payload: {
    title: string;
    description: string;
    category: string;
    priority: string;
    address: string;
    locality?: string;
    latitude?: number;
    longitude?: number;
    geocoding_id?: string;
    selection_method?: string;
  }) => request<ComplaintDetail>('/complaints', { method: 'POST', body: JSON.stringify(payload) }),

  uploadComplaintImage: (complaintId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>(`/complaints/${complaintId}/upload-image`, {
      method: 'POST',
      body: formData,
    });
  },

  getComplaints: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    category?: string;
    priority?: string;
    department_id?: number;
    search?: string;
    is_demo?: boolean;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.department_id) query.append('department_id', params.department_id.toString());
    if (params.search) query.append('search', params.search);
    if (params.is_demo !== undefined) query.append('is_demo', params.is_demo.toString());
    return request<ComplaintListResponse>(`/complaints?${query.toString()}`);
  },

  getComplaint: (id: number) => request<ComplaintDetail>(`/complaints/${id}`),

  addFollowup: (id: number, message: string) =>
    request<{ message: string }>(`/complaints/${id}/followup`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  updateComplaintAdmin: (
    id: number,
    payload: {
      status?: string;
      department_id?: number;
      priority?: string;
      admin_notes?: string;
      status_note?: string;
    }
  ) =>
    request<ComplaintDetail>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getOfficialSummary: (complaintId: number, authorityId?: number) => {
    const q = authorityId ? `?authority_id=${authorityId}` : '';
    return request<{ plain_text: string; markdown: string }>(`/complaints/${complaintId}/official-summary${q}`);
  },

  recordOfficialSubmission: (
    complaintId: number,
    payload: { official_reference_number: string; authority_id?: number; notes?: string }
  ) =>
    request<ExternalSubmission>(`/complaints/${complaintId}/record-official-submission`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateOfficialSubmission: (complaintId: number, authorityId?: number) =>
    request<ExternalSubmission>(`/complaints/${complaintId}/simulate-official-submission`, {
      method: 'POST',
      body: JSON.stringify({ authority_id: authorityId }),
    }),

  // Authorities
  getAuthorities: (departmentId?: number, category?: string) => {
    const q = new URLSearchParams();
    if (departmentId) q.append('department_id', departmentId.toString());
    if (category) q.append('category', category);
    return request<Authority[]>(`/authorities?${q.toString()}`);
  },

  createAuthority: (payload: Partial<Authority>) =>
    request<Authority>('/authorities', { method: 'POST', body: JSON.stringify(payload) }),

  updateAuthority: (id: number, payload: Partial<Authority>) =>
    request<Authority>(`/authorities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Analytics
  getAnalytics: () => request<AnalyticsOverview>('/analytics/overview'),

  // Audit Logs
  getAuditLogs: (page = 1, pageSize = 20, action?: string) => {
    const q = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (action) q.append('action', action);
    return request<AuditLogListResponse>(`/audit-logs?${q.toString()}`);
  },

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),

  // Demo Management
  resetDemoData: () => request<{ message: string }>('/demo/reset', { method: 'POST' }),
};
