import type { Foundation } from "@/entities/foundation/model";
import type { TaskCategory, TaskCommitment, TaskFormat, TaskStatus, VolunteerTask } from "@/entities/task/model";
import type {
  ApiApplication,
  ApiApplicationStatus,
  ApiFundProfile,
  ApiFundStatus,
  ApiTask,
  ApiVolunteerHistoryItem
} from "@/shared/api/types";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

const acceptedStatuses: ApiApplicationStatus[] = ["accepted", "completion_confirmed", "hours_awarded"];

export function mapApiTaskToVolunteerTask(task: ApiTask, applications: ApiApplication[] = []): VolunteerTask {
  const filled = applications.filter((application) => application.task_id === task.id && acceptedStatuses.includes(application.status)).length;
  const spots = task.participant_limit ?? Math.max(filled, 1);
  const format = mapTaskFormat(task.participation_format);
  const requirements = splitText(task.requirements);
  const skills = task.required_skills ?? [];

  return {
    id: task.id,
    title: task.title,
    foundation: task.fund?.name ?? "Фонд",
    foundationId: task.fund_id,
    city: task.city ?? (format === "online" ? "Онлайн" : "Город уточняется"),
    format,
    commitment: mapTaskCommitment(task.duration_type),
    category: task.category as TaskCategory,
    proBono: task.task_type === "pro_bono",
    date: formatDateRange(task.starts_at, task.ends_at),
    deadline: task.deadline_at ? `до ${formatDate(task.deadline_at)}` : "без дедлайна",
    hours: Number(task.expected_hours),
    spots,
    filled,
    status: mapTaskStatus(task.status),
    skills,
    impact: task.description,
    description: task.description,
    location: task.location ?? task.online_url ?? (format === "online" ? "Онлайн" : "Место уточняется"),
    contact: {
      name: task.fund?.name ?? "Координатор фонда",
      role: "Организатор задания",
      phone: "Контакты откроются после принятия"
    },
    requirements: requirements.length ? requirements : ["Требования уточняются фондом"],
    instructions: requirements.length ? requirements.slice(0, 3) : ["Откликнитесь на задание", "Дождитесь решения фонда", "Получите организационные детали"],
    timeline: buildTimeline(task)
  };
}

export function mapApiFundToFoundation(fund: ApiFundProfile, tasks: ApiTask[] = [], applications: ApiApplication[] = []): Foundation {
  const fundTasks = tasks.filter((task) => task.fund_id === fund.id);
  const acceptedCount = applications.filter((application) => acceptedStatuses.includes(application.status)).length;
  const totalApplications = applications.length;
  const activeTasks = fundTasks.filter((task) => task.status === "published" || task.status === "pending_review").length;
  const volunteersNeeded = fundTasks.reduce((sum, task) => sum + Math.max((task.participant_limit ?? 0) - acceptedCount, 0), 0);

  return {
    id: fund.id,
    name: fund.name,
    focus: fund.description ?? fund.planned_help ?? "Описание фонда появится после заполнения профиля",
    city: fund.region ?? "Регион не указан",
    activeTasks,
    volunteersNeeded,
    responseRate: totalApplications ? Math.round((acceptedCount / totalApplications) * 100) : 0,
    moderationStatus: mapFundStatus(fund.status),
    curator: fund.contact_person ?? fund.representative?.full_name ?? "Куратор не указан",
    reportsReady: fund.documents.length
  };
}

export function foundationFromTask(task: VolunteerTask): Foundation {
  return {
    id: task.foundationId,
    name: task.foundation,
    focus: task.impact,
    city: task.city,
    activeTasks: 1,
    volunteersNeeded: Math.max(task.spots - task.filled, 0),
    responseRate: 0,
    moderationStatus: "approved",
    curator: task.contact.name,
    reportsReady: 0
  };
}

export function mapApplicationStatus(status: ApiApplicationStatus): ApplicationStatus {
  const statuses: Record<ApiApplicationStatus, ApplicationStatus> = {
    applied: "pending",
    accepted: "accepted",
    rejected: "rejected",
    canceled: "idle",
    completion_confirmed: "completed",
    hours_awarded: "hours"
  };
  return statuses[status];
}

export function mapFundStatus(status: ApiFundStatus): Foundation["moderationStatus"] {
  const statuses: Record<ApiFundStatus, Foundation["moderationStatus"]> = {
    draft: "draft",
    pending_review: "review",
    approved: "approved",
    needs_changes: "changes",
    rejected: "rejected"
  };
  return statuses[status];
}

export function mapTaskStatus(status: ApiTask["status"]): TaskStatus {
  if (status === "published") return "open";
  if (status === "closed") return "completed";
  return "in_progress";
}

export function mapTaskFormat(format: ApiTask["participation_format"]): TaskFormat {
  return format === "offline" ? "onsite" : "online";
}

export function mapTaskCommitment(duration: ApiTask["duration_type"]): TaskCommitment {
  const values: Record<ApiTask["duration_type"], TaskCommitment> = {
    one_time: "one-time",
    regular: "regular",
    long_term: "long-term"
  };
  return values[duration];
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt) return "Дата уточняется";
  if (!endsAt) return formatDateTime(startsAt);
  return `${formatDateTime(startsAt)} - ${new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(endsAt))}`;
}

export function splitText(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\n|;|\.\s+/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

export function historyTaskToVolunteerTask(item: ApiVolunteerHistoryItem): VolunteerTask | null {
  if (!item.task) return null;
  return {
    id: item.task.id,
    title: item.task.title,
    foundation: item.task.fund_name ?? "Фонд",
    foundationId: item.task.fund_name ?? item.task.id,
    city: item.task.participation_format === "online" ? "Онлайн" : "Город уточняется",
    format: mapTaskFormat(item.task.participation_format),
    commitment: "one-time",
    category: item.task.category as TaskCategory,
    proBono: item.task.task_type === "pro_bono",
    date: formatDateTime(item.occurred_at),
    deadline: "история",
    hours: Number(item.hours ?? 0),
    spots: 1,
    filled: item.status && acceptedStatuses.includes(item.status) ? 1 : 0,
    status: item.status === "hours_awarded" || item.status === "completion_confirmed" ? "completed" : "in_progress",
    skills: [],
    impact: item.description ?? item.title,
    description: item.description ?? item.title,
    location: item.task.participation_format === "online" ? "Онлайн" : "Место уточняется",
    contact: { name: item.task.fund_name ?? "Фонд", role: "Организатор", phone: "Контакты в заявке" },
    requirements: [],
    instructions: [],
    timeline: [{ time: formatDateTime(item.occurred_at), title: item.title, description: item.description ?? "" }]
  };
}

function buildTimeline(task: ApiTask) {
  return [
    { time: task.deadline_at ? formatDateTime(task.deadline_at) : "До старта", title: "Дедлайн отклика", description: "Фонд принимает заявки волонтеров" },
    { time: task.starts_at ? formatDateTime(task.starts_at) : "Старт уточняется", title: "Старт задания", description: task.location ?? task.online_url ?? "" },
    { time: task.ends_at ? formatDateTime(task.ends_at) : "После завершения", title: "Подтверждение", description: "Фонд подтверждает участие" }
  ];
}
