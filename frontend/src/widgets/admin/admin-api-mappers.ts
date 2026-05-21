import { Building2, CheckCircle2, Clock3, ListChecks, MessageCircle, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import type {
  AdminCompletionItemResponse,
  AdminDashboardSummary,
  AdminFundDetailResponse,
  AdminFundListItemResponse,
  AdminTaskDetailResponse,
  AdminTaskDirectoryItemResponse,
  AdminVolunteerDirectoryItemResponse,
  NotificationResponse,
  PublicVolunteerProfileResponse,
  PlatformAnalyticsReport
} from "@/shared/api/types";
import { resolveApiFileUrl } from "@/shared/api/config";
import type { AdminFoundation, AdminHourCase, AdminNotification, AdminTask, AdminTone, AdminVolunteer } from "@/widgets/admin/admin-data";
import { getCategoryLabel, getSkillLabel, getTaskVisual } from "@/widgets/volunteer-feed/task-dictionaries";

function formatNumber(value: number | string) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat("ru-RU").format(numeric);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "только что";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" }).format(new Date(value));
}

function getFileNameFromUrl(value: string) {
  const normalized = value.split("?")[0]?.split("#")[0] ?? value;
  return decodeURIComponent(normalized.split("/").filter(Boolean).at(-1) ?? value);
}

function avatarUrl(value?: string | null) {
  return resolveApiFileUrl(value) ?? "/logo.png";
}

function mapDocumentStatus(status: AdminFundDetailResponse["status"]): AdminFoundation["documents"][number]["status"] {
  if (status === "needs_changes") return "replace";
  if (status === "approved") return "verified";
  return "uploaded";
}

function mapTaskFormat(value: AdminTaskDirectoryItemResponse["participation_format"]): AdminTask["format"] {
  return value === "online" ? "Онлайн" : "Офлайн";
}

function mapTaskStatus(value: AdminTaskDirectoryItemResponse["status"]): AdminTask["status"] {
  const statuses: Record<AdminTaskDirectoryItemResponse["status"], AdminTask["status"]> = {
    closed: "completed",
    draft: "draft",
    needs_changes: "returned",
    pending_review: "moderation",
    published: "published",
    rejected: "rejected"
  };
  return statuses[value];
}

function mapFundStatus(value: AdminFundListItemResponse["status"]): AdminFoundation["status"] {
  const statuses: Record<AdminFundListItemResponse["status"], AdminFoundation["status"]> = {
    approved: "approved",
    draft: "pending",
    needs_changes: "revision",
    pending_review: "pending",
    rejected: "rejected"
  };
  return statuses[value];
}

function mapAdminNotificationTarget(notification: NotificationResponse) {
  const content = `${notification.title} ${notification.body}`.toLowerCase();

  if (content.includes("час") || content.includes("выполн")) {
    return "/admin/hours";
  }

  if (content.includes("задани")) {
    return "/admin/moderation/tasks";
  }

  if (content.includes("фонд") || content.includes("документ")) {
    return "/admin/moderation/foundations";
  }

  return "/admin/notifications";
}

export function mapAdminNotification(notification: NotificationResponse): AdminNotification {
  return {
    id: notification.id,
    target: mapAdminNotificationTarget(notification),
    text: notification.body,
    time: formatDateTime(notification.created_at),
    title: notification.title,
    tone: notification.is_read ? "wait" : "brand",
    unread: !notification.is_read
  };
}

export function mapAdminFundListItem(fund: AdminFundListItemResponse): AdminFoundation {
  return {
    activeTasks: 0,
    categories: [],
    contactName: fund.contact_person ?? "Контакт не указан",
    contactRole: "Контактное лицо",
    description: fund.moderation_comment ?? "Фонд ожидает решения администратора.",
    documents: [],
    email: fund.contact_email ?? "",
    hours: 0,
    id: fund.id,
    inn: fund.inn ?? "—",
    logo: "/logo.png",
    name: fund.name,
    ogrn: fund.ogrn ?? "—",
    phone: "",
    plannedActivities: [],
    region: fund.region ?? "Регион не указан",
    registeredAt: formatDate(fund.created_at),
    socials: "",
    status: mapFundStatus(fund.status),
    volunteers: 0,
    website: ""
  };
}

export function mapAdminFundDetail(fund: AdminFundDetailResponse): AdminFoundation {
  return {
    ...mapAdminFundListItem(fund),
    categories: (fund.help_categories ?? []).map(getCategoryLabel),
    contactName: fund.contact_person ?? fund.representative.full_name ?? "Контакт не указан",
    contactRole: fund.contact_position ?? "Контактное лицо",
    description: fund.description ?? fund.moderation_comment ?? "Описание фонда не заполнено.",
    documents: fund.documents.map((document) => ({
      fileName: getFileNameFromUrl(document.file_url),
      fileUrl: document.file_url,
      status: mapDocumentStatus(fund.status),
      title: document.document_type
    })),
    email: fund.contact_email ?? fund.representative.email,
    phone: fund.contact_phone ?? "",
    plannedActivities: fund.planned_help ? [fund.planned_help] : [],
    website: fund.website_url ?? ""
  };
}

export function mapAdminTaskDirectoryItem(task: AdminTaskDirectoryItemResponse): AdminTask {
  return {
    category: getCategoryLabel(task.category),
    city: task.city ?? "Онлайн",
    communication: "",
    contacts: "",
    deadline: formatDate(task.deadline_at),
    description: task.description,
    filled: task.filled_spots,
    format: mapTaskFormat(task.participation_format),
    foundation: task.fund_name,
    foundationId: task.fund_id,
    goal: task.description,
    hours: Number(task.expected_hours),
    id: task.id,
    image: getTaskVisual(task.id, task.image_url).image,
    instruction: "",
    location: task.city ?? "Онлайн",
    materials: [],
    period: `${formatDate(task.starts_at)} - ${formatDate(task.ends_at)}`,
    proBono: task.task_type === "pro_bono",
    requirements: [],
    spots: task.participant_limit ?? 0,
    status: mapTaskStatus(task.status),
    title: task.title,
    volunteerActions: []
  };
}

export function mapAdminTaskDetail(task: AdminTaskDetailResponse): AdminTask {
  return {
    category: getCategoryLabel(task.category),
    city: task.city ?? "Онлайн",
    communication: task.online_url ? "Онлайн-ссылка указана в задании" : "Контакты и инструкции указаны фондом",
    contacts: task.online_url ?? task.location ?? "Не указано",
    deadline: formatDate(task.deadline_at),
    description: task.description,
    filled: 0,
    format: mapTaskFormat(task.participation_format),
    foundation: task.fund.name,
    foundationId: task.fund_id,
    goal: task.description,
    hours: Number(task.expected_hours),
    id: task.id,
    image: getTaskVisual(task.id, task.image_url).image,
    instruction: task.materials_url ?? "Материалы и подробности доступны в описании задания.",
    location: task.location ?? task.online_url ?? task.city ?? "Онлайн",
    materials: task.materials_url ? [task.materials_url] : [],
    moderatorComment: task.moderation_comment ?? undefined,
    period: `${formatDate(task.starts_at)} - ${formatDate(task.ends_at)}`,
    proBono: task.task_type === "pro_bono",
    requirements: task.required_skills?.length ? task.required_skills : task.requirements ? [task.requirements] : [],
    spots: task.participant_limit ?? 0,
    status: mapTaskStatus(task.status),
    title: task.title,
    volunteerActions: task.requirements ? [task.requirements] : []
  };
}

export function mapAdminCompletionItem(item: AdminCompletionItemResponse, fundName?: string): AdminHourCase {
  return {
    approvedHours: Number(item.task.expected_hours),
    city: item.volunteer.city ?? "Город не указан",
    confirmedByFoundation: formatDate(item.completion_confirmed_at),
    foundation: fundName ?? "Фонд",
    id: item.id,
    note: item.completion_comment ?? "Фонд подтвердил участие.",
    requestedHours: Number(item.task.expected_hours),
    status: "ready",
    taskId: item.task_id,
    taskTitle: item.task.title,
    volunteer: item.volunteer.full_name ?? item.volunteer.email,
    volunteerAvatar: avatarUrl(item.volunteer.avatar_url)
  };
}

export function mapAdminVolunteerDirectoryItem(volunteer: AdminVolunteerDirectoryItemResponse, profile?: PublicVolunteerProfileResponse): AdminVolunteer {
  const hours = Number(volunteer.hours);
  const completedTasks = profile?.stats.completed_tasks ?? volunteer.completed_tasks;
  return {
    activities: completedTasks,
    avatar: avatarUrl(profile?.avatar_url ?? volunteer.avatar_url),
    badges: profile?.achievements.filter((achievement) => achievement.is_awarded).map((achievement) => achievement.title) ?? [],
    categories: [
      { label: "Выполнено", value: Math.min(100, completedTasks * 10) },
      { label: "Активные", value: Math.min(100, volunteer.active_tasks * 20) },
      { label: "Отклики", value: Math.min(100, volunteer.applications_total * 8) }
    ],
    city: volunteer.city ?? profile?.city ?? "Город не указан",
    history: [],
    hours,
    id: volunteer.id,
    interests: mapAdminLabels(profile?.interests ?? volunteer.interests),
    name: volunteer.full_name ?? profile?.full_name ?? volunteer.email,
    proSkills: mapAdminLabels(profile?.pro_bono_skills),
    role: volunteer.position ?? profile?.position ?? volunteer.department ?? "Волонтёр",
    skills: mapAdminLabels(profile?.skills ?? volunteer.skills),
    status: volunteer.active_tasks > 0 || completedTasks > 0 || hours > 0 ? "active" : "new"
  };
}

function mapAdminLabels(values: string[] | null | undefined) {
  return Array.from(new Set((values ?? []).map((value) => {
    const skill = getSkillLabel(value);
    if (skill !== value) return skill;
    return getCategoryLabel(value);
  }).filter(Boolean)));
}

export function buildAdminKpisFromApi(summary: AdminDashboardSummary, analytics?: PlatformAnalyticsReport) {
  return [
    { label: "Фонды на модерации", value: formatNumber(summary.funds_pending_review), helper: `${formatNumber(summary.funds_total)} всего`, icon: Building2, tone: "review" },
    { label: "Задания на модерации", value: formatNumber(summary.tasks_pending_review), helper: `${formatNumber(summary.tasks_total)} всего`, icon: ShieldCheck, tone: "brand" },
    { label: "Опубликованные задания", value: formatNumber(summary.tasks_published), helper: "активных заданий", icon: ListChecks, tone: "success" },
    { label: "Завершённые задания", value: formatNumber(summary.completions_waiting_hours), helper: "ждут начисления часов", icon: CheckCircle2, tone: "done" },
    { label: "Волонтёры", value: formatNumber(analytics?.volunteers_total ?? 0), helper: "зарегистрировано", icon: UsersRound, tone: "review" },
    { label: "Подтверждённые часы", value: formatNumber(summary.awarded_hours_total), helper: "начислено всего", icon: Clock3, tone: "success" },
    { label: "Активные отклики", value: formatNumber(summary.applications_total), helper: "всего заявок", icon: MessageCircle, tone: "revision" }
  ] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: AdminTone }[];
}
