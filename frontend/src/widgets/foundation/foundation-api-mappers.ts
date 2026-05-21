import { BarChart3, CheckCircle2, FileText, Inbox, RotateCcw, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import type {
  ApplicationResponse,
  ApplicationStatus,
  FundDashboardSummary,
  FundProfileResponse,
  FundStatus,
  FundUpdateRequest,
  HelpCategory,
  TaskCreateRequest,
  TaskResponse,
  TaskStatus,
  TaskUpdateRequest
} from "@/shared/api/types";
import type { FoundationDocumentItem } from "@/widgets/foundation-registration/foundation-registration-data";
import type { FoundationProfileForm } from "@/widgets/foundation/foundation-profile-data";
import type { FoundationApplicationItem, FoundationApplicationStatus, FoundationTaskItem, FoundationTaskStatus, FoundationTone } from "@/widgets/foundation/foundation-data";
import type { FoundationTaskFormValues } from "@/widgets/foundation/ui/create-task-form";
import { resolveApiFileUrl } from "@/shared/api/config";
import { getCategoryLabel, getSkillLabel } from "@/widgets/volunteer-feed/task-dictionaries";

function formatDate(value?: string | null, fallback = "дата не указана") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatPeriod(task: TaskResponse) {
  if (task.starts_at && task.ends_at) {
    return `${formatDate(task.starts_at)} - ${formatDate(task.ends_at)}`;
  }

  if (task.starts_at) return formatDate(task.starts_at);
  if (task.published_at) return formatDate(task.published_at);
  return "период не указан";
}

function taskStatus(status: TaskStatus): FoundationTaskStatus {
  const statuses: Record<TaskStatus, FoundationTaskStatus> = {
    closed: "completed",
    draft: "draft",
    needs_changes: "returned",
    pending_review: "moderation",
    published: "published",
    rejected: "rejected"
  };

  return statuses[status];
}

function applicationStatus(status: ApplicationStatus): FoundationApplicationStatus {
  const statuses: Record<ApplicationStatus, FoundationApplicationStatus> = {
    accepted: "accepted",
    applied: "review",
    canceled: "rejected",
    clarify: "clarify",
    completion_confirmed: "completed",
    hours_awarded: "confirmed",
    not_completed: "not_completed",
    rejected: "rejected"
  };

  return statuses[status];
}

function applicationsForTask(applications: ApplicationResponse[], taskId: string) {
  return applications.filter((item) => item.task_id === taskId);
}

function participantsCount(applications: ApplicationResponse[]) {
  return applications.filter((item) => item.status === "accepted" || item.status === "completion_confirmed" || item.status === "hours_awarded").length;
}

function taskFormat(task: TaskResponse): FoundationTaskItem["format"] {
  return task.participation_format === "online" ? "Онлайн" : "Офлайн";
}

function taskContacts(task: TaskResponse): FoundationTaskItem["contacts"] {
  return {
    telegram: "",
    whatsapp: "",
    email: "",
    phone: "",
    chatLink: task.materials_url || task.online_url || "",
    instruction: task.requirements || ""
  };
}

export function mapTaskResponseToFoundationTask(task: TaskResponse, applications: ApplicationResponse[] = []): FoundationTaskItem {
  const taskApplications = applicationsForTask(applications, task.id);

  return {
    id: task.id,
    taskId: task.id,
    imageUrl: task.image_url,
    title: task.title,
    description: task.description,
    category: getCategoryLabel(task.category),
    city: task.participation_format === "online" ? "Онлайн" : task.city ?? "Город не указан",
    format: taskFormat(task),
    deadline: task.deadline_at ? `до ${formatDate(task.deadline_at)}` : "без дедлайна",
    period: formatPeriod(task),
    participants: participantsCount(taskApplications),
    capacity: task.participant_limit ?? 100,
    responses: taskApplications.length,
    hours: Number(task.expected_hours),
    instructions: task.requirements ?? "",
    location: task.location ?? task.online_url ?? "",
    requirements: splitLines(task.requirements),
    skills: task.required_skills?.map(getSkillLabel).filter(Boolean) ?? [],
    status: taskStatus(task.status),
    taskType: task.task_type,
    moderationComment: task.moderation_comment ?? undefined,
    contactVisibility: "after_acceptance",
    contacts: taskContacts(task)
  };
}

export function mapApplicationResponseToFoundationApplication(application: ApplicationResponse): FoundationApplicationItem {
  const volunteer = application.volunteer;
  const task = application.task;
  const status = applicationStatus(application.status);
  const interests = mapLabels(volunteer?.interests);
  const skills = mapLabels(volunteer?.skills);
  const proBonoSkills = mapLabels(volunteer?.pro_bono_skills);

  return {
    id: application.id,
    volunteer: volunteer?.full_name || volunteer?.email || "Волонтёр",
    volunteerEmail: volunteer?.email || undefined,
    volunteerPhone: volunteer?.phone || undefined,
    role: volunteer?.position || volunteer?.department || "Волонтёр",
    city: volunteer?.city || "Город не указан",
    avatar: resolveApiFileUrl(volunteer?.avatar_url) ?? "",
    taskTitle: task?.title ?? "Задание",
    skills,
    proBonoSkills,
    interests,
    hoursHistory: 0,
    completedActivities: 0,
    relevance: 0,
    status,
    comment: application.fund_comment || application.volunteer_comment || application.completion_comment || applicationCommentByStatus(status),
    nextStep: applicationNextStepByStatus(status),
    appliedAt: formatDate(application.created_at),
    attendanceDecision: status === "confirmed" || status === "completed" ? "participated" : status === "rejected" ? "missed" : "pending",
    taskId: application.task_id
  };
}

export function mapDashboardToMetrics(summary: FundDashboardSummary) {
  return [
    {
      label: "Активные задания",
      value: String(summary.tasks_published),
      helper: `${summary.tasks_pending_review} на модерации`,
      icon: FileText,
      tone: "gold"
    },
    {
      label: "Отклики",
      value: String(summary.applications_total),
      helper: `${summary.applications_applied} требуют ответа`,
      icon: Inbox,
      tone: "blue"
    },
    {
      label: "Принятые волонтёры",
      value: String(summary.applications_accepted),
      helper: "по заданиям фонда",
      icon: UsersRound,
      tone: "green"
    },
    {
      label: "Подтверждённые часы",
      value: String(summary.awarded_hours_total),
      helper: "после закрытия активностей",
      icon: ShieldCheck,
      tone: "violet"
    }
  ] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: FoundationTone }[];
}

export function mapDashboardToReportMetrics(summary: FundDashboardSummary) {
  return [
    { label: "Завершённые задания", value: String(summary.tasks_closed), helper: "закрытые задания", icon: CheckCircle2, tone: "green" },
    { label: "Отклики", value: String(summary.applications_total), helper: "всего по фонду", icon: BarChart3, tone: "blue" },
    { label: "Принятые участники", value: String(summary.applications_accepted), helper: "по активным заданиям", icon: UsersRound, tone: "gold" },
    { label: "Ожидают подтверждения", value: String(summary.completions_waiting_hours), helper: "после активности", icon: RotateCcw, tone: "violet" }
  ] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: FoundationTone }[];
}

export function mapFundProfileToCurrentFoundation(profile: FundProfileResponse, summary?: FundDashboardSummary) {
  const helpCategories = mapHelpCategories(profile.help_categories);

  return {
    id: profile.id,
    name: profile.name,
    focus: helpCategories.join(", ") || "Направления помощи",
    city: profile.region || "Регион не указан",
    activeTasks: summary?.tasks_published ?? 0,
    volunteersNeeded: summary?.applications_applied ?? 0,
    responseRate: summary?.applications_total ? Math.round((summary.applications_accepted / summary.applications_total) * 100) : 0,
    moderationStatus: profile.status === "approved" ? "approved" as const : profile.status === "needs_changes" ? "changes" as const : "review" as const,
    curator: profile.contact_person || profile.representative?.full_name || "Координатор",
    reportsReady: summary?.tasks_closed ?? 0,
    description: profile.description || "Описание фонда пока не заполнено.",
    legal: `ИНН ${profile.inn || "-"} / ОГРН ${profile.ogrn || "-"}`,
    website: profile.website_url || "",
    socials: "",
    trust: fundTrustLabel(profile.status),
    categories: helpCategories.length ? helpCategories : ["Помощь"],
    helpDirections: splitPlannedHelp(profile.planned_help)
  };
}

export function mapFundProfileToProfileForm(profile: FundProfileResponse): FoundationProfileForm {
  return {
    name: profile.name,
    description: profile.description || "",
    region: profile.region || "",
    inn: profile.inn || "",
    ogrn: profile.ogrn || "",
    email: profile.contact_email || profile.representative?.email || "",
    phone: profile.contact_phone || profile.representative?.phone || "",
    telegram: "",
    whatsapp: "",
    website: profile.website_url || "",
    socials: "",
    contactName: profile.contact_person || profile.representative?.full_name || "",
    contactRole: profile.contact_position || "",
    categories: mapHelpCategories(profile.help_categories),
    activityTypes: splitPlannedHelp(profile.planned_help),
    logoUrl: profile.logo_url,
    logoUploaded: Boolean(profile.logo_url),
    logoFileName: profile.logo_url?.split("/").pop(),
    coverUrl: profile.cover_url,
    coverUploaded: Boolean(profile.cover_url),
    coverFileName: profile.cover_url?.split("/").pop()
  };
}

export function mapFundDocuments(profile: FundProfileResponse): FoundationDocumentItem[] {
  return profile.documents.map((document) => ({
    id: document.document_type,
    title: document.document_type,
    description: "Документ фонда",
    fileUrl: document.file_url,
    fileName: document.file_url.split("/").pop() || document.file_url,
    status: "uploaded"
  }));
}

export function buildFundUpdateRequest(form: FoundationProfileForm): FundUpdateRequest {
  return {
    contact_email: form.email.trim() || null,
    contact_person: form.contactName.trim() || null,
    contact_phone: form.phone.trim() || null,
    contact_position: form.contactRole.trim() || null,
    description: form.description.trim() || null,
    help_categories: form.categories,
    inn: form.inn.trim() || null,
    name: form.name.trim(),
    ogrn: form.ogrn.trim() || null,
    planned_help: [
      ...form.activityTypes,
      form.telegram.trim() ? `Telegram: ${form.telegram.trim()}` : "",
      form.whatsapp.trim() ? `WhatsApp: ${form.whatsapp.trim()}` : "",
      form.socials.trim() ? `Соцсети: ${form.socials.trim()}` : ""
    ].filter(Boolean).join("\n") || null,
    region: form.region.trim() || null,
    website_url: form.website.trim() || null
  };
}

export function buildTaskCreateRequest(values: FoundationTaskFormValues): TaskCreateRequest {
  const participationFormat = values.format === "Онлайн" ? "online" : "offline";
  const deadline = parseDateInput(values.deadline);
  const startsAt = null;

  return {
    category: mapUiCategoryToBackend(values.category),
    city: participationFormat === "offline" ? values.city : null,
    deadline_at: deadline,
    description: buildTaskDescription(values),
    duration_type: mapUiDuration(values.periodicity),
    expected_hours: Math.max(Number(values.hours) || 1, 1),
    location: participationFormat === "offline" ? values.location.trim() || null : null,
    materials_url: values.chatLink.trim() || null,
    online_url: participationFormat === "online" ? values.location.trim() || null : null,
    participant_limit: Number(values.capacity) || null,
    participation_format: participationFormat,
    required_skills: values.skills,
    requirements: values.requirements.join("\n") || null,
    starts_at: startsAt,
    task_type: values.taskType,
    title: values.title.trim()
  };
}

export function buildTaskUpdateRequest(values: FoundationTaskFormValues): TaskUpdateRequest {
  return buildTaskCreateRequest(values);
}

function buildTaskDescription(values: FoundationTaskFormValues) {
  const details = [
    values.description.trim(),
    values.instructions.trim() ? `Инструкции: ${values.instructions.trim()}` : "",
    values.telegram.trim() ? `Telegram: ${values.telegram.trim()}` : "",
    values.whatsapp.trim() ? `WhatsApp: ${values.whatsapp.trim()}` : "",
    values.email.trim() ? `Email: ${values.email.trim()}` : "",
    values.phone.trim() ? `Телефон: ${values.phone.trim()}` : "",
    values.contactNote.trim() ? `Комментарий: ${values.contactNote.trim()}` : ""
  ].filter(Boolean);

  return details.join("\n\n");
}

function mapUiCategoryToBackend(category: string): HelpCategory {
  const supportedCategories: HelpCategory[] = [
    "children",
    "communications",
    "content",
    "design",
    "disability",
    "ecology",
    "education",
    "elderly",
    "events",
    "it",
    "legal",
    "logistics",
    "pro_bono",
    "sport",
    "targeted_help"
  ];
  if (supportedCategories.includes(category as HelpCategory)) return category as HelpCategory;

  const lower = category.toLowerCase();
  if (lower.includes("адрес")) return "targeted_help";
  if (lower.includes("дизайн")) return "design";
  if (lower.includes("эко")) return "ecology";
  if (lower.includes("it") || lower.includes("разработ")) return "it";
  if (lower.includes("контент")) return "content";
  if (lower.includes("коммуникац")) return "communications";
  if (lower.includes("логист")) return "logistics";
  if (lower.includes("образ")) return "education";
  if (lower.includes("событ")) return "events";
  if (lower.includes("спорт")) return "sport";
  if (lower.includes("юрид")) return "legal";
  if (lower.includes("pro bono") || lower.includes("профессион")) return "pro_bono";
  if (lower.includes("пожил")) return "elderly";
  if (lower.includes("овз") || lower.includes("инклю")) return "disability";
  return "children";
}

function mapUiDuration(value: string): TaskCreateRequest["duration_type"] {
  if (value === "Регулярное" || value === "Регулярные") return "regular";
  if (value === "По договорённости" || value === "Долгосрочное" || value === "Долгосрочные") return "long_term";
  return "one_time";
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso.toISOString();

  const numeric = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (numeric) {
    const [, day, month, year] = numeric;
    return new Date(Number(year), Number(month) - 1, Number(day), 12).toISOString();
  }

  const months: Record<string, number> = {
    апреля: 3,
    августа: 7,
    декабря: 11,
    июля: 6,
    июня: 5,
    марта: 2,
    мая: 4,
    ноября: 10,
    октября: 9,
    сентября: 8,
    февраля: 1,
    января: 0
  };
  const ru = /(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i.exec(trimmed);
  if (ru) {
    const [, day, monthName, year] = ru;
    const month = months[monthName.toLowerCase()];
    if (month !== undefined) return new Date(Number(year), month, Number(day), 12).toISOString();
  }

  return null;
}

function splitPlannedHelp(value: string | null) {
  return (value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapHelpCategories(categories: string[] | null | undefined) {
  return (categories ?? [])
    .map((category) => getCategoryLabel(category))
    .filter(Boolean);
}

function mapLabels(values: string[] | null | undefined) {
  return Array.from(new Set((values ?? []).map((value) => {
    const skill = getSkillLabel(value);
    if (skill !== value) return skill;
    return getCategoryLabel(value);
  }).filter(Boolean)));
}

function fundTrustLabel(status: FundStatus) {
  const labels: Record<FundStatus, string> = {
    approved: "Проверенная организация",
    draft: "Черновик профиля",
    needs_changes: "Нужны правки",
    pending_review: "Фонд на проверке",
    rejected: "Профиль отклонён"
  };
  return labels[status];
}

function applicationCommentByStatus(status: FoundationApplicationStatus) {
  const comments: Record<FoundationApplicationStatus, string> = {
    accepted: "Волонтёр назначен на задачу. Контакты и инструкции доступны.",
    clarify: "Фонд запросил уточнение перед финальным решением.",
    completed: "Фонд подтвердил выполнение. Часы ожидают проверки.",
    confirmed: "Администратор начислил часы.",
    not_completed: "Участие закрыто как невыполненное с комментарием.",
    rejected: "Заявка отклонена с комментарием фонда.",
    review: "Заявка ожидает решения фонда."
  };
  return comments[status];
}

function applicationNextStepByStatus(status: FoundationApplicationStatus) {
  const steps: Record<FoundationApplicationStatus, string> = {
    accepted: "После завершения задания подтвердите выполнение участника",
    clarify: "Дождитесь ответа волонтёра",
    completed: "Ожидает начисления часов администратором",
    confirmed: "Часы начислены",
    not_completed: "Результат зафиксирован",
    rejected: "Заявка закрыта",
    review: "Примите решение по заявке"
  };
  return steps[status];
}
