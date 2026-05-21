export type ApiUserRole = "volunteer" | "fund" | "admin";
export type ApiFundStatus = "draft" | "pending_review" | "approved" | "needs_changes" | "rejected";
export type ApiTaskStatus = "draft" | "pending_review" | "published" | "needs_changes" | "rejected" | "closed";
export type ApiApplicationStatus = "applied" | "accepted" | "rejected" | "canceled" | "completion_confirmed" | "hours_awarded";
export type ApiHelpCategory = "children" | "elderly" | "disability" | "ecology";
export type ApiParticipationFormat = "online" | "offline";
export type ApiDurationType = "one_time" | "regular" | "long_term";
export type ApiTaskType = "regular" | "pro_bono";

export interface ApiUser {
  id: string;
  role: ApiUserRole;
  username: string | null;
  email: string;
  full_name: string | null;
  city: string | null;
  employee_id: string | null;
  department: string | null;
  position: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: "bearer";
  user: ApiUser;
}

export interface VolunteerRegisterRequest {
  email: string;
  password: string;
  full_name?: string | null;
  city?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  department?: string | null;
  position?: string | null;
  interests?: string[];
  skills?: string[];
}

export interface FundRegisterRequest {
  email: string;
  password: string;
  representative_full_name: string;
  representative_phone?: string | null;
  name: string;
  description?: string | null;
  help_categories?: string[];
  inn?: string | null;
  ogrn?: string | null;
  region?: string | null;
  website_url?: string | null;
  contact_person?: string | null;
  contact_position?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  planned_help?: string | null;
}

export interface VolunteerRegisterResponse {
  user: ApiUser;
}

export interface FundRegisterResponse {
  user: ApiUser;
  fund: ApiFundShort;
}

export interface ApiFundShort {
  id: string;
  name: string;
  status: ApiFundStatus;
  moderation_comment: string | null;
  created_at: string;
}

export interface ApiFundDocument {
  id: string;
  fund_id?: string;
  document_type: string;
  file_url: string;
  created_at: string;
}

export interface ApiFundRepresentative {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

export interface ApiFundProfile {
  id: string;
  representative_user_id: string;
  name: string;
  description: string | null;
  help_categories: string[] | null;
  inn: string | null;
  ogrn: string | null;
  region: string | null;
  website_url: string | null;
  contact_person: string | null;
  contact_position: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  planned_help: string | null;
  status: ApiFundStatus;
  moderation_comment: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  representative: ApiFundRepresentative | null;
  documents: ApiFundDocument[];
}

export interface ApiTaskFund {
  id: string;
  name: string;
  status: ApiFundStatus | string;
}

export interface ApiTask {
  id: string;
  fund_id: string;
  title: string;
  description: string;
  category: ApiHelpCategory;
  participation_format: ApiParticipationFormat;
  duration_type: ApiDurationType;
  task_type: ApiTaskType;
  city: string | null;
  location: string | null;
  online_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  deadline_at: string | null;
  participant_limit: number | null;
  requirements: string | null;
  required_skills: string[] | null;
  expected_hours: string | number;
  materials_url: string | null;
  status: ApiTaskStatus;
  moderation_comment: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  fund: ApiTaskFund | null;
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  category: ApiHelpCategory;
  participation_format: ApiParticipationFormat;
  duration_type: ApiDurationType;
  task_type?: ApiTaskType;
  city?: string | null;
  location?: string | null;
  online_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  deadline_at?: string | null;
  participant_limit?: number | null;
  requirements?: string | null;
  required_skills?: string[];
  expected_hours: string;
  materials_url?: string | null;
}

export interface ApiApplicationVolunteer {
  id: string;
  email: string;
  full_name: string | null;
  city: string | null;
  department: string | null;
  position: string | null;
}

export interface ApiApplication {
  id: string;
  task_id: string;
  volunteer_id: string;
  status: ApiApplicationStatus;
  volunteer_comment: string | null;
  fund_comment: string | null;
  completion_comment: string | null;
  decided_at: string | null;
  canceled_at: string | null;
  completion_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  task: ApiTask | null;
  volunteer: ApiApplicationVolunteer | null;
}

export interface ApiAchievement {
  code: string;
  title: string;
  description: string;
  is_awarded: boolean;
  awarded_at: string | null;
  progress_current: string | number;
  progress_target: string | number;
}

export interface ApiVolunteerHistoryItem {
  event_type: string;
  occurred_at: string;
  title: string;
  description: string | null;
  application_id: string | null;
  task: {
    id: string;
    title: string;
    category: ApiHelpCategory;
    participation_format: ApiParticipationFormat;
    task_type: ApiTaskType;
    fund_name: string | null;
  } | null;
  achievement_code: string | null;
  status: ApiApplicationStatus | null;
  hours: string | number | null;
}

export interface ApiAdminDashboard {
  funds_total: number;
  funds_pending_review: number;
  tasks_total: number;
  tasks_pending_review: number;
  tasks_published: number;
  applications_total: number;
  completions_waiting_hours: number;
  awarded_hours_total: string | number;
}

export interface ApiAdminFund {
  id: string;
  name: string;
  status: ApiFundStatus;
  inn: string | null;
  ogrn: string | null;
  region: string | null;
  contact_person: string | null;
  contact_email: string | null;
  moderation_comment: string | null;
  created_at: string | null;
  updated_at: string | null;
  approved_at: string | null;
}

export interface ApiAdminFundDetail extends ApiAdminFund {
  description: string | null;
  help_categories: string[] | null;
  website_url: string | null;
  contact_position: string | null;
  contact_phone: string | null;
  planned_help: string | null;
  representative: ApiApplicationVolunteer;
  documents: ApiFundDocument[];
}

export interface ApiAdminTask {
  id: string;
  fund_id: string;
  title: string;
  category: ApiHelpCategory;
  participation_format: ApiParticipationFormat;
  duration_type: ApiDurationType;
  task_type: ApiTaskType;
  city: string | null;
  starts_at: string | null;
  ends_at: string | null;
  deadline_at: string | null;
  participant_limit: number | null;
  expected_hours: string | number;
  status: ApiTaskStatus;
  moderation_comment: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAdminTaskDetail extends ApiAdminTask {
  description: string;
  location: string | null;
  online_url: string | null;
  requirements: string | null;
  required_skills: string[] | null;
  materials_url: string | null;
  fund: ApiAdminFund;
}

export interface ApiAdminApplication {
  id: string;
  task_id: string;
  volunteer_id: string;
  status: ApiApplicationStatus;
  volunteer_comment: string | null;
  fund_comment: string | null;
  completion_comment: string | null;
  decided_at: string | null;
  completion_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAdminCompletion extends ApiAdminApplication {
  task: ApiAdminTask;
  volunteer: ApiApplicationVolunteer;
}
