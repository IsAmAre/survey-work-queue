export interface SurveyRequest {
  id: string;
  order_number: number;
  request_number: string;
  applicant_name: string;
  days_pending: number;
  surveyor_name: string;
  survey_type: string;
  appointment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SearchQuery {
  request_number: string;
  applicant_name: string;
}

export interface SearchResult {
  success: boolean;
  data?: SurveyRequest;
  error?: string;
}

export interface UploadData {
  order_number: number;
  request_number: string;
  applicant_name: string;
  days_pending: number;
  surveyor_name: string;
  survey_type: string;
  appointment_date: string;
  status: string;
}

export interface AdminSurveyRequestsResponse {
  data: SurveyRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminStatsResponse {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  todaySearches: number;
  statusBreakdown: Record<string, number>;
  dailySearches: Record<string, number>;
  completionRate: number;
}

export interface SearchLog {
  id: string;
  search_query: SearchQuery;
  applicant_name?: string;
  ip_address: string;
  created_at: string;
}