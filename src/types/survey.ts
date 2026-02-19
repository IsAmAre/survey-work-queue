export interface SurveyRequest {
  id: string;
  request_number: string;
  applicant_name: string;
  surveyor_name: string;
  survey_type: string;
  appointment_date: string;
  status: string;
  document_type: string;
  document_number: string;
  action_date: string;
  order_number?: number;
  days_pending?: number;
  created_at: string;
  updated_at: string;
}

export interface SearchQuery {
  search_term: string;
}

export interface SearchResult {
  success: boolean;
  data?: SurveyRequest[];
  error?: string;
}

export interface UploadData {
  request_number: string;
  survey_type: string;
  applicant_name: string;
  document_type: string;
  document_number: string;
  surveyor_name: string;
  appointment_date: string;
  status: string;
  action_date: string;
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