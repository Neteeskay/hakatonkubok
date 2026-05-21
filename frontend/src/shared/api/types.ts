export type Uuid = string;
export type DateTimeString = string;
export type DecimalString = string;

export type UserRole = "volunteer" | "fund" | "admin";
export type FundStatus = "draft" | "pending_review" | "approved" | "needs_changes" | "rejected";
export type TaskStatus = "draft" | "pending_review" | "published" | "needs_changes" | "rejected" | "closed";
export type ApplicationStatus = "applied" | "accepted" | "rejected" | "canceled" | "completion_confirmed" | "hours_awarded";
export type ParticipationFormat = "online" | "offline";
export type DurationType = "one_time" | "regular" | "long_term";
export type TaskType = "regular" | "pro_bono";
export type HelpCategory =
  | "children"
  | "communications"
  | "content"
  | "design"
  | "disability"
  | "ecology"
  | "education"
  | "elderly"
  | "events"
  | "it"
  | "legal"
  | "logistics"
  | "pro_bono"
  | "sport"
  | "targeted_help";
export type TaskFeedSort = "published_at_desc" | "deadline_at_asc" | "expected_hours_desc" | "expected_hours_asc";

export interface AuthTokenFields {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
}

export interface UserResponse {
  city: string | null;
  created_at: DateTimeString;
  department: string | null;
  email: string;
  employee_id: string | null;
  full_name: string | null;
  id: Uuid;
  interests: string[] | null;
  phone: string | null;
  position: string | null;
  role: UserRole;
  skills: string[] | null;
  username: string | null;
}

export interface VolunteerRegisterRequest {
  city?: string | null;
  department?: string | null;
  email: string;
  employee_id?: string | null;
  full_name?: string | null;
  interests?: string[];
  password: string;
  phone?: string | null;
  position?: string | null;
  skills?: string[];
}

export interface VolunteerRegisterResponse extends AuthTokenFields {
  user: UserResponse;
}

export interface FundRegisterRequest {
  contact_email?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_position?: string | null;
  description?: string | null;
  email: string;
  help_categories?: string[];
  inn?: string | null;
  name: string;
  ogrn?: string | null;
  password: string;
  planned_help?: string | null;
  region?: string | null;
  representative_full_name: string;
  representative_phone?: string | null;
  website_url?: string | null;
}

export interface FundResponse {
  created_at: DateTimeString;
  id: Uuid;
  moderation_comment: string | null;
  name: string;
  status: FundStatus;
}

export interface FundRegisterResponse extends AuthTokenFields {
  fund: FundResponse;
  user: UserResponse;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token?: string | null;
}

export interface TokenResponse extends AuthTokenFields {
  user: UserResponse;
}

export interface FundRepresentativeResponse {
  email: string;
  full_name: string | null;
  id: Uuid;
  phone: string | null;
}

export interface FundDocumentResponse {
  created_at: DateTimeString;
  document_type: string;
  file_url: string;
  fund_id: Uuid;
  id: Uuid;
}

export interface FundProfileResponse {
  approved_at: DateTimeString | null;
  contact_email: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_position: string | null;
  created_at: DateTimeString;
  description: string | null;
  documents: FundDocumentResponse[];
  help_categories: string[] | null;
  id: Uuid;
  inn: string | null;
  moderation_comment: string | null;
  name: string;
  ogrn: string | null;
  planned_help: string | null;
  region: string | null;
  representative: FundRepresentativeResponse | null;
  representative_user_id: Uuid;
  status: FundStatus;
  updated_at: DateTimeString;
  website_url: string | null;
}

export interface FundDashboardSummary {
  applications_accepted: number;
  applications_applied: number;
  applications_completion_confirmed: number;
  applications_hours_awarded: number;
  applications_rejected: number;
  applications_total: number;
  awarded_hours_total: DecimalString;
  completions_waiting_hours: number;
  fund_id: Uuid;
  fund_name: string;
  fund_status: FundStatus;
  tasks_closed: number;
  tasks_draft: number;
  tasks_needs_changes: number;
  tasks_pending_review: number;
  tasks_published: number;
  tasks_rejected: number;
  tasks_total: number;
}

export interface FundUpdateRequest {
  contact_email?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_position?: string | null;
  description?: string | null;
  help_categories?: string[] | null;
  inn?: string | null;
  name?: string | null;
  ogrn?: string | null;
  planned_help?: string | null;
  region?: string | null;
  website_url?: string | null;
}

export interface TaskFundResponse {
  id: Uuid;
  name: string;
  status: string;
}

export interface TaskResponse {
  category: HelpCategory;
  city: string | null;
  closed_at: DateTimeString | null;
  created_at: DateTimeString;
  deadline_at: DateTimeString | null;
  description: string;
  duration_type: DurationType;
  ends_at: DateTimeString | null;
  expected_hours: DecimalString;
  fund: TaskFundResponse | null;
  fund_id: Uuid;
  id: Uuid;
  location: string | null;
  materials_url: string | null;
  moderation_comment: string | null;
  online_url: string | null;
  participant_limit: number | null;
  participation_format: ParticipationFormat;
  published_at: DateTimeString | null;
  required_skills: string[] | null;
  requirements: string | null;
  starts_at: DateTimeString | null;
  status: TaskStatus;
  task_type: TaskType;
  title: string;
  updated_at: DateTimeString;
}

export interface TaskCreateRequest {
  category: HelpCategory;
  city?: string | null;
  deadline_at?: DateTimeString | null;
  description: string;
  duration_type: DurationType;
  ends_at?: DateTimeString | null;
  expected_hours: number | string;
  location?: string | null;
  materials_url?: string | null;
  online_url?: string | null;
  participant_limit?: number | null;
  participation_format: ParticipationFormat;
  required_skills?: string[];
  requirements?: string | null;
  starts_at?: DateTimeString | null;
  task_type?: TaskType;
  title: string;
}

export type TaskUpdateRequest = Partial<Omit<TaskCreateRequest, "required_skills">> & {
  required_skills?: string[] | null;
};

export interface TaskFeedQuery {
  available_only?: boolean;
  category?: HelpCategory;
  city?: string;
  duration?: DurationType;
  format?: ParticipationFormat;
  fund_id?: Uuid;
  limit?: number;
  offset?: number;
  required_skill?: string;
  search?: string;
  sort?: TaskFeedSort;
  type?: TaskType;
}

export interface ApplicationVolunteerShort {
  city: string | null;
  department: string | null;
  email: string;
  full_name: string | null;
  id: Uuid;
  position: string | null;
}

export interface ApplicationResponse {
  canceled_at: DateTimeString | null;
  completion_comment: string | null;
  completion_confirmed_at: DateTimeString | null;
  created_at: DateTimeString;
  decided_at: DateTimeString | null;
  fund_comment: string | null;
  id: Uuid;
  status: ApplicationStatus;
  task: TaskResponse | null;
  task_id: Uuid;
  updated_at: DateTimeString;
  volunteer: ApplicationVolunteerShort | null;
  volunteer_comment: string | null;
  volunteer_id: Uuid;
}

export interface ApplicationCreateRequest {
  volunteer_comment?: string | null;
}

export interface ApplicationDecisionRequest {
  fund_comment?: string | null;
}

export interface ApplicationRejectRequest {
  fund_comment: string;
}

export interface ApplicationCompletionConfirmRequest {
  completion_comment?: string | null;
}

export interface TaskCompletionsConfirmRequest {
  completion_comment?: string | null;
}

export interface VolunteerProfileUpdateRequest {
  about?: string | null;
  city?: string | null;
  full_name?: string | null;
  interests?: string[] | null;
  phone?: string | null;
  pro_bono_skills?: string[] | null;
  skills?: string[] | null;
}

export interface VolunteerAchievementCriterionResponse {
  current: DecimalString;
  is_completed: boolean;
  key: string;
  metadata: Record<string, unknown>;
  progress_percent: DecimalString;
  remaining: DecimalString;
  target: DecimalString;
  title: string;
  unit: string;
  unit_label: string;
}

export interface VolunteerAchievementResponse {
  awarded_at: DateTimeString | null;
  category: string | null;
  category_label: string | null;
  code: string;
  criteria: VolunteerAchievementCriterionResponse[];
  description: string;
  is_awarded: boolean;
  is_completed: boolean | null;
  metadata: Record<string, unknown>;
  progress_current: DecimalString;
  progress_percent: DecimalString | null;
  progress_target: DecimalString;
  remaining: DecimalString | null;
  sort_order: number | null;
  title: string;
  unit: string | null;
  unit_label: string | null;
}

export interface VolunteerAchievementStatsResponse {
  active_applications_count: number;
  activity_span_days: number;
  applications_count: number;
  canceled_applications_count: number;
  children_completed_count: number;
  completed_tasks_count: number;
  controlled_participations_count: number;
  daily_activity_streak_days: number;
  ecology_completed_count: number;
  fast_response_count: number;
  long_term_progress_percent: DecimalString;
  offline_completed_count: number;
  online_completed_count: number;
  pro_bono_completed_count: number;
  reliable_success_ratio_percent: DecimalString;
  support_completed_count: number;
  team_completed_count: number;
  total_hours: DecimalString;
  weekly_streak_weeks: number;
}

export interface VolunteerAchievementsOverviewResponse {
  achievements: VolunteerAchievementResponse[];
  awarded_count: number;
  in_progress_count: number;
  next_achievement: VolunteerAchievementResponse | null;
  overall_progress_percent: DecimalString;
  stats: VolunteerAchievementStatsResponse;
  total_count: number;
}

export interface VolunteerHoursSummaryResponse {
  entries_count: number;
  first_awarded_at: DateTimeString | null;
  last_awarded_at: DateTimeString | null;
  tasks_count: number;
  total_hours: DecimalString;
}

export interface VolunteerHoursLedgerItemResponse {
  admin_comment: string | null;
  application_id: Uuid;
  awarded_at: DateTimeString;
  category: HelpCategory;
  fund_id: Uuid | null;
  fund_name: string | null;
  hours: DecimalString;
  id: Uuid;
  task_id: Uuid;
  task_title: string;
}

export interface VolunteerHoursDynamicsItemResponse {
  entries_count: number;
  hours: DecimalString;
  period: DateTimeString;
}

export interface VolunteerHoursByCategoryItemResponse {
  category: HelpCategory;
  hours: DecimalString;
  tasks_count: number;
}

export interface VolunteerProfileStatsResponse {
  active_applications: number;
  achievements_awarded: number;
  achievements_total: number;
  applications_total: number;
  completed_tasks: number;
  next_level_hours: DecimalString | null;
  profile_level: number;
  profile_level_title: string;
  total_hours: DecimalString;
}

export interface PublicVolunteerProfileResponse {
  about: string | null;
  achievements: VolunteerAchievementResponse[];
  avatar_url: string | null;
  city: string | null;
  created_at: DateTimeString;
  department: string | null;
  full_name: string | null;
  id: Uuid;
  interests: string[] | null;
  position: string | null;
  pro_bono_skills: string[] | null;
  skills: string[] | null;
  stats: VolunteerProfileStatsResponse;
}

export interface VolunteerHistoryTaskResponse {
  category: HelpCategory;
  fund_name: string | null;
  id: Uuid;
  participation_format: ParticipationFormat;
  task_type: TaskType;
  title: string;
}

export interface VolunteerHistoryItemResponse {
  achievement_code: string | null;
  application_id: Uuid | null;
  description: string | null;
  event_type: string;
  hours: DecimalString | null;
  occurred_at: DateTimeString;
  status: ApplicationStatus | null;
  task: VolunteerHistoryTaskResponse | null;
  title: string;
}

export interface NotificationResponse {
  body: string;
  created_at: DateTimeString;
  id: Uuid;
  is_read: boolean;
  title: string;
}

export interface ParticipantReportRow {
  applications_count: number;
  awarded_hours: DecimalString;
  city: string | null;
  completed_tasks_count: number;
  department: string | null;
  email: string;
  full_name: string | null;
  position: string | null;
  registered_at: DateTimeString;
  volunteer_id: Uuid;
}

export interface PlatformAnalyticsReport {
  accepted_applications: number;
  applications_total: number;
  awarded_hours_total: DecimalString;
  completions_waiting_hours: number;
  funds_approved: number;
  funds_pending_review: number;
  funds_total: number;
  tasks_closed: number;
  tasks_pending_review: number;
  tasks_published: number;
  tasks_total: number;
  volunteers_total: number;
}

export interface AdminDashboardSummary {
  applications_total: number;
  awarded_hours_total: DecimalString;
  completions_waiting_hours: number;
  funds_pending_review: number;
  funds_total: number;
  tasks_pending_review: number;
  tasks_published: number;
  tasks_total: number;
}

export interface AdminNotificationReadCount {
  updated_count: number;
}

export interface AdminFundListItemResponse {
  approved_at: DateTimeString | null;
  contact_email: string | null;
  contact_person: string | null;
  created_at: DateTimeString | null;
  id: Uuid;
  inn: string | null;
  moderation_comment: string | null;
  name: string;
  ogrn: string | null;
  region: string | null;
  status: FundStatus;
  updated_at: DateTimeString | null;
}

export interface AdminFundDocumentResponse {
  created_at: DateTimeString;
  document_type: string;
  file_url: string;
  id: Uuid;
}

export interface AdminFundDetailResponse extends AdminFundListItemResponse {
  contact_phone: string | null;
  contact_position: string | null;
  description: string | null;
  documents: AdminFundDocumentResponse[];
  help_categories: string[] | null;
  planned_help: string | null;
  representative: {
    city: string | null;
    department: string | null;
    email: string;
    full_name: string | null;
    id: Uuid;
    position: string | null;
    role: UserRole;
  };
  website_url: string | null;
}

export interface AdminFundModerationRequest {
  comment?: string | null;
  target_status: Extract<FundStatus, "approved" | "needs_changes" | "rejected">;
}

export interface AdminTaskDirectoryItemResponse {
  applications_accepted: number;
  applications_applied: number;
  applications_canceled: number;
  applications_completion_confirmed: number;
  applications_hours_awarded: number;
  applications_rejected: number;
  applications_total: number;
  available_spots: number | null;
  category: HelpCategory;
  city: string | null;
  created_at: DateTimeString;
  deadline_at: DateTimeString | null;
  description: string;
  duration_type: DurationType;
  ends_at: DateTimeString | null;
  expected_hours: DecimalString;
  filled_spots: number;
  fund_id: Uuid;
  fund_name: string;
  id: Uuid;
  participant_limit: number | null;
  participation_format: ParticipationFormat;
  starts_at: DateTimeString | null;
  status: TaskStatus;
  task_type: TaskType;
  title: string;
  updated_at: DateTimeString;
}

export interface AdminTaskDetailResponse {
  category: HelpCategory;
  city: string | null;
  closed_at: DateTimeString | null;
  created_at: DateTimeString;
  deadline_at: DateTimeString | null;
  description: string;
  duration_type: DurationType;
  ends_at: DateTimeString | null;
  expected_hours: DecimalString;
  fund: AdminFundListItemResponse;
  fund_id: Uuid;
  id: Uuid;
  location: string | null;
  materials_url: string | null;
  moderation_comment: string | null;
  online_url: string | null;
  participant_limit: number | null;
  participation_format: ParticipationFormat;
  published_at: DateTimeString | null;
  required_skills: string[] | null;
  requirements: string | null;
  starts_at: DateTimeString | null;
  status: TaskStatus;
  task_type: TaskType;
  title: string;
  updated_at: DateTimeString;
}

export interface AdminTaskModerationRequest {
  comment?: string | null;
  target_status: Extract<TaskStatus, "published" | "needs_changes" | "rejected">;
}

export interface AdminCompletionItemResponse {
  completion_comment: string | null;
  completion_confirmed_at: DateTimeString | null;
  created_at: DateTimeString;
  decided_at: DateTimeString | null;
  fund_comment: string | null;
  id: Uuid;
  status: ApplicationStatus;
  task: {
    category: HelpCategory;
    city: string | null;
    created_at: DateTimeString;
    deadline_at: DateTimeString | null;
    duration_type: DurationType;
    ends_at: DateTimeString | null;
    expected_hours: DecimalString;
    fund_id: Uuid;
    id: Uuid;
    participant_limit: number | null;
    participation_format: ParticipationFormat;
    starts_at: DateTimeString | null;
    status: TaskStatus;
    task_type: TaskType;
    title: string;
    updated_at: DateTimeString;
  };
  task_id: Uuid;
  updated_at: DateTimeString;
  volunteer: {
    city: string | null;
    department: string | null;
    email: string;
    full_name: string | null;
    id: Uuid;
    position: string | null;
    role: UserRole;
  };
  volunteer_comment: string | null;
  volunteer_id: Uuid;
}

export interface AdminAwardHoursRequest {
  admin_comment?: string | null;
  hours: DecimalString | number;
}

export interface AdminHourLedgerResponse {
  admin_comment: string | null;
  application_id: Uuid;
  awarded_at: DateTimeString;
  awarded_by: Uuid;
  hours: DecimalString;
  id: Uuid;
  task_id: Uuid;
  volunteer_id: Uuid;
}

export interface AdminVolunteerDirectoryItemResponse {
  active_tasks: number;
  applications_total: number;
  city: string | null;
  completed_tasks: number;
  created_at: DateTimeString | null;
  department: string | null;
  email: string;
  full_name: string | null;
  hours: DecimalString;
  id: Uuid;
  interests: string[] | null;
  position: string | null;
  skills: string[] | null;
}
