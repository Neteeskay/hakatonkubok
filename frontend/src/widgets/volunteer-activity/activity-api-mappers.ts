import { CalendarCheck2, CheckCircle2, Clock3, MessageCircle, PencilLine, Star, UsersRound, XCircle, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import type { ApplicationResponse, ApplicationStatus as ApiApplicationStatus, NotificationResponse, VolunteerHistoryItemResponse } from "@/shared/api/types";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";
import { mapTaskResponseToVolunteerTask } from "@/widgets/volunteer-feed/task-api-mappers";
import type { HistoryStatus, HistoryTone, VolunteerHistoryEntry } from "@/widgets/volunteer-activity/history-data";
import type { NotificationTarget, NotificationTone, VolunteerNotification } from "@/widgets/volunteer-activity/notification-data";
import type { VolunteerApplicationItem, VolunteerApplicationStage } from "@/widgets/volunteer-activity/activity-data";

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Дата уточняется";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";

  return new Intl.DateTimeFormat("ru-RU", options ?? { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function apiStatusToStage(status: ApiApplicationStatus): VolunteerApplicationStage {
  const stages: Record<ApiApplicationStatus, VolunteerApplicationStage> = {
    accepted: "accepted",
    applied: "pending",
    canceled: "rejected",
    clarify: "pending",
    completion_confirmed: "completed",
    hours_awarded: "hours",
    not_completed: "rejected",
    rejected: "rejected"
  };
  return stages[status];
}

export function apiStatusToDetailStatus(status: ApiApplicationStatus): ApplicationStatus {
  const statuses: Record<ApiApplicationStatus, ApplicationStatus> = {
    accepted: "accepted",
    applied: "pending",
    canceled: "rejected",
    clarify: "pending",
    completion_confirmed: "completed",
    hours_awarded: "hours",
    not_completed: "rejected",
    rejected: "rejected"
  };
  return statuses[status];
}

function applicationCopy(status: ApiApplicationStatus) {
  const copy: Record<ApiApplicationStatus, Pick<VolunteerApplicationItem, "title" | "statusLabel" | "stageLabel" | "progress" | "nextAction" | "message">> = {
    applied: {
      title: "Ожидается решение фонда",
      statusLabel: "На рассмотрении",
      stageLabel: "Фонд проверяет отклик",
      progress: 30,
      nextAction: "Пока ничего делать не нужно",
      message: "Фонд рассматривает заявку. Когда статус изменится, обновление появится в откликах и уведомлениях."
    },
    accepted: {
      title: "Вы приняты к участию",
      statusLabel: "Принят",
      stageLabel: "Контакты и материалы доступны",
      progress: 58,
      nextAction: "Связаться с координатором и согласовать детали",
      message: "Фонд принял отклик. Организационные детали доступны в карточке отклика."
    },
    clarify: {
      title: "Фонд просит уточнение",
      statusLabel: "Нужны детали",
      stageLabel: "Уточнение отклика",
      progress: 42,
      nextAction: "Ответить фонду по доступным контактам",
      message: "Фонд оставил вопрос по отклику. Посмотрите комментарий и уточните детали участия."
    },
    rejected: {
      title: "Отклик не принят",
      statusLabel: "Отклонён",
      stageLabel: "Комментарий фонда",
      progress: 100,
      nextAction: "Можно откликнуться на другие задания",
      message: "Фонд отклонил отклик. Если фонд оставил комментарий, он показан ниже."
    },
    canceled: {
      title: "Отклик отменён",
      statusLabel: "Отменён",
      stageLabel: "Отменено волонтёром",
      progress: 100,
      nextAction: "Можно выбрать другое задание",
      message: "Отклик отменён и больше не участвует в наборе."
    },
    completion_confirmed: {
      title: "Участие завершено",
      statusLabel: "Завершено",
      stageLabel: "Фонд подтвердил участие",
      progress: 86,
      nextAction: "Ожидается начисление часов",
      message: "Фонд подтвердил выполнение задания. Часы появятся после проверки."
    },
    hours_awarded: {
      title: "Часы начислены",
      statusLabel: "Часы начислены",
      stageLabel: "Участие подтверждено",
      progress: 100,
      nextAction: "Можно посмотреть часы в профиле",
      message: "Волонтёрские часы добавлены в профиль и попадут в отчётность."
    },
    not_completed: {
      title: "Участие не подтверждено",
      statusLabel: "Не выполнено",
      stageLabel: "Фонд оставил решение",
      progress: 100,
      nextAction: "Можно выбрать другое задание",
      message: "Фонд отметил, что участие не выполнено. Если фонд оставил комментарий, он показан ниже."
    }
  };

  return copy[status];
}

export function mapApplicationResponseToItem(application: ApplicationResponse): VolunteerApplicationItem {
  const task = application.task ? mapTaskResponseToVolunteerTask(application.task) : createFallbackTask(application.task_id);
  const copy = applicationCopy(application.status);
  const contactUnlocked = application.status === "accepted" || application.status === "completion_confirmed" || application.status === "hours_awarded";

  return {
    id: application.id,
    task,
    stage: apiStatusToStage(application.status),
    detailStatus: apiStatusToDetailStatus(application.status),
    ...copy,
    eventDate: task.date,
    appliedAt: formatDate(application.created_at),
    deadline: task.deadline,
    foundationComment: application.fund_comment ?? undefined,
    contactUnlocked,
    contact: contactUnlocked
      ? {
          name: task.contact.name,
          role: task.contact.role,
          email: "Не указан",
          phone: task.contact.phone,
          telegram: "Не указан",
          whatsapp: "Не указан",
          chat: `Задание «${task.title}»`,
          instruction: application.fund_comment ?? application.completion_comment ?? "Свяжитесь с фондом по доступным контактам, если они указаны организатором."
        }
      : undefined
  };
}

function historyStatus(status: ApiApplicationStatus | null): HistoryStatus {
  if (status === "hours_awarded") return "hours";
  if (status === "completion_confirmed") return "completed";
  if (status === "accepted") return "accepted";
  if (status === "rejected" || status === "canceled" || status === "not_completed") return "rejected";
  return "pending";
}

function createFallbackTask(id: string, title = "Задание", fundName = "Фонд"): VolunteerTask {
  return {
    id,
    title,
    foundation: fundName,
    foundationId: fundName,
    city: "Онлайн",
    format: "online",
    commitment: "one-time",
    category: "children",
    proBono: false,
    date: "Дата уточняется",
    deadline: "без дедлайна",
    hours: 0,
    spots: 100,
    filled: 0,
    status: "completed",
    skills: [],
    impact: "История участия",
    description: "Детали задания доступны в истории участия.",
    location: "Онлайн",
    contact: { name: fundName, role: "Координатор задания", phone: "Не указан" },
    requirements: ["Детали задания не переданы в ответе истории"],
    instructions: ["Откройте актуальное задание из ленты, если оно опубликовано"],
    timeline: [{ time: "Дата уточняется", title: "Участие", description: "Событие из истории волонтёра" }]
  };
}

export function mapHistoryResponseToEntry(item: VolunteerHistoryItemResponse): VolunteerHistoryEntry {
  const status = historyStatus(item.status);
  const task = item.task
    ? createFallbackTask(item.task.id, item.task.title, item.task.fund_name ?? "Фонд")
    : createFallbackTask(item.application_id ?? item.occurred_at, item.title);
  task.category = item.task?.category ?? task.category;
  task.format = item.task?.participation_format === "offline" ? "onsite" : "online";
  task.proBono = item.task?.task_type === "pro_bono";
  task.hours = Number(item.hours ?? 0);

  const occurredAt = new Date(item.occurred_at);

  return {
    id: `${item.event_type}-${item.occurred_at}`,
    task,
    status,
    detailStatus: item.status ? apiStatusToDetailStatus(item.status) : "idle",
    date: formatDate(item.occurred_at, { day: "numeric", month: "long" }),
    year: Number.isNaN(occurredAt.getTime()) ? "" : String(occurredAt.getFullYear()),
    completedAt: formatDate(item.occurred_at),
    confirmedAt: status === "hours" ? formatDate(item.occurred_at) : undefined,
    hours: Number(item.hours ?? 0),
    description: item.description ?? item.title,
    formatLabel: item.task?.participation_format === "offline" ? "Офлайн" : "Онлайн",
    result: item.description ?? item.title
  };
}

export function buildHistorySummary(entries: VolunteerHistoryEntry[]) {
  const totalHours = entries.reduce((sum, item) => sum + item.hours, 0);
  const completed = entries.filter((item) => item.status === "completed" || item.status === "hours").length;
  const funds = new Set(entries.map((item) => item.task.foundation).filter(Boolean)).size;
  const confirmed = entries.filter((item) => item.status === "hours").length;

  return [
    { value: String(totalHours), label: "волонтёрских часов", helper: "по данным платформы", tone: "gold", icon: Clock3 },
    { value: String(completed), label: "задания выполнено", helper: "завершённые участия", tone: "green", icon: CalendarCheck2 },
    { value: String(funds), label: "фондов и организаций", helper: "вы помогли", tone: "violet", icon: UsersRound },
    { value: String(confirmed), label: "подтверждений", helper: "с начисленными часами", tone: "cream", icon: Star }
  ] satisfies { value: string; label: string; helper: string; tone: HistoryTone; icon: LucideIcon }[];
}

export function buildMonthlyActivity(entries: VolunteerHistoryEntry[]) {
  const months = new Map<string, number>();

  entries.forEach((entry) => {
    const key = `${entry.date.split(" ")[1] ?? entry.date}`;
    months.set(key, (months.get(key) ?? 0) + entry.hours);
  });

  return Array.from(months, ([month, hours]) => ({ month, hours })).slice(0, 6);
}

export function buildCityContribution(entries: VolunteerHistoryEntry[]) {
  const cities = new Map<string, number>();

  entries.forEach((entry) => {
    cities.set(entry.task.city, (cities.get(entry.task.city) ?? 0) + entry.hours);
  });

  return Array.from(cities, ([city, hours]) => ({ city, hours })).slice(0, 5);
}

function dateLabel(value: string): VolunteerNotification["dateLabel"] {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Сегодня";
  if (date.toDateString() === yesterday.toDateString()) return "Вчера";
  return "Ранее";
}

function inferNotificationMeta(notification: NotificationResponse): { tone: NotificationTone; target: NotificationTarget; icon: VolunteerNotification["icon"]; actionLabel: string } {
  const text = `${notification.title} ${notification.body}`.toLowerCase();

  if (text.includes("отклон")) return { tone: "rejected", target: "application", icon: XCircle, actionLabel: "Открыть отклики" };
  if (text.includes("принят") || text.includes("приняли")) return { tone: "accepted", target: "application", icon: CheckCircle2, actionLabel: "Открыть отклики" };
  if (text.includes("час")) return { tone: "hours", target: "hours", icon: Star, actionLabel: "Мои часы" };
  if (text.includes("профил") || text.includes("навык")) return { tone: "system", target: "profile", icon: PencilLine, actionLabel: "Открыть профиль" };
  return { tone: "review", target: "application", icon: MessageCircle, actionLabel: "Открыть отклики" };
}

export function mapNotificationResponseToItem(notification: NotificationResponse): VolunteerNotification {
  const meta = inferNotificationMeta(notification);

  return {
    id: notification.id,
    title: notification.title,
    text: notification.body,
    time: formatTime(notification.created_at),
    dateLabel: dateLabel(notification.created_at),
    unread: !notification.is_read,
    tone: meta.tone,
    icon: meta.icon,
    target: meta.target,
    actionLabel: meta.actionLabel
  };
}
