export type UserRole = 'citizen' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentRecommendation {
  category: string;
  department_id?: number | null;
  department_name: string;
  department_slug: string;
  explanation: string;
}

export type ComplaintStatus =
  | 'Submitted to CivicTrack'
  | 'Under Review'
  | 'Authority Recommended'
  | 'Awaiting Official Submission'
  | 'Official Submission Confirmed'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected'
  | 'Follow-up Required';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ComplaintImage {
  id: number;
  complaint_id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  url: string;
  created_at: string;
}

export interface ComplaintHistory {
  id: number;
  complaint_id: number;
  previous_status?: string | null;
  new_status: string;
  acting_user_id?: number | null;
  acting_user_name?: string | null;
  action_type: string;
  notes?: string | null;
  created_at: string;
}

export interface ExternalSubmission {
  id: number;
  complaint_id: number;
  authority_id?: number | null;
  authority_name?: string | null;
  submission_type: string;
  official_reference_number?: string | null;
  is_verified: boolean;
  status: string;
  disclaimer: string;
  response_payload?: string | null;
  created_at: string;
}

export interface DuplicateSuggestion {
  id: number;
  tracking_id: string;
  title: string;
  category: string;
  status: string;
  similarity_score: number;
  distance_km?: number | null;
  address: string;
  created_at: string;
}

export interface ComplaintListItem {
  id: number;
  tracking_id: string;
  title: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  address: string;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  department_id?: number | null;
  department_name?: string | null;
  is_demo: boolean;
  is_escalated: boolean;
  escalation_reason?: string | null;
  hours_in_status: number;
  created_at: string;
  updated_at: string;
}

export interface ComplaintDetail extends ComplaintListItem {
  citizen_id: number;
  citizen_name: string;
  citizen_email: string;
  description: string;
  department?: Department | null;
  recommended_department_id?: number | null;
  recommended_department?: Department | null;
  recommendation_reason?: string | null;
  admin_notes?: string | null;
  geocoding_id?: string | null;
  selection_method?: string | null;
  recommended_escalation_action?: string | null;
  resolved_at?: string | null;
  history: ComplaintHistory[];
  images: ComplaintImage[];
  external_submissions: ExternalSubmission[];
  possible_duplicates: DuplicateSuggestion[];
}

export interface ComplaintListResponse {
  items: ComplaintListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Authority {
  id: number;
  department_id?: number | null;
  name: string;
  jurisdiction: string;
  supported_categories: string;
  official_website?: string | null;
  official_portal_url?: string | null;
  public_contact_phone?: string | null;
  public_contact_email?: string | null;
  source_url?: string | null;
  last_verification_date?: string | null;
  is_verified: boolean;
  integration_type: string;
  integration_availability: string;
  notes?: string | null;
  created_at: string;
}

export interface StatCount {
  name: string;
  count: number;
  color?: string | null;
}

export interface TimelinePoint {
  date: string;
  count: number;
  resolved: number;
}

export interface GeoPoint {
  id: number;
  tracking_id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
  priority?: string;
  category: string;
  address?: string;
  locality?: string | null;
  department_name?: string | null;
}

export interface AnalyticsOverview {
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  rejected_complaints: number;
  average_resolution_hours: number;
  escalated_count: number;
  by_department: StatCount[];
  by_category: StatCount[];
  by_status: StatCount[];
  by_priority: StatCount[];
  timeline: TimelinePoint[];
  geo_distribution: GeoPoint[];
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  complaint_id?: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
