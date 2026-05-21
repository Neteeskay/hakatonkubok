import type { Foundation } from "@/entities/foundation/model";
import type { TaskCommitment, TaskFormat, TaskStatus, VolunteerTask } from "@/entities/task/model";
import type { TaskResponse } from "@/shared/api/types";
import { getCategoryLabel } from "@/widgets/volunteer-feed/task-dictionaries";

function formatDate(value?: string | null, fallback = "Дата уточняется") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDeadline(value?: string | null) {
  if (!value) return "без дедлайна";
  return `до ${formatDate(value, "дата уточняется")}`;
}

function toTaskFormat(format: TaskResponse["participation_format"]): TaskFormat {
  return format === "online" ? "online" : "onsite";
}

function toTaskCommitment(duration: TaskResponse["duration_type"]): TaskCommitment {
  if (duration === "long_term") return "long-term";
  if (duration === "regular") return "regular";
  return "one-time";
}

function toTaskStatus(status: TaskResponse["status"]): TaskStatus {
  if (status === "closed") return "completed";
  if (status === "published") return "open";
  return "in_progress";
}

function splitLines(value?: string | null) {
  return (value ?? "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function taskLocation(task: TaskResponse) {
  if (task.participation_format === "online") {
    return task.online_url ?? "Онлайн";
  }

  return task.location ?? task.city ?? "Место уточняется";
}

export function mapTaskResponseToVolunteerTask(task: TaskResponse): VolunteerTask {
  const skills = task.required_skills?.filter(Boolean) ?? [];
  const requirements = splitLines(task.requirements);
  const startsAt = formatDate(task.starts_at, task.published_at ? formatDate(task.published_at) : "Дата уточняется");
  const spots = task.participant_limit ?? 100;

  return {
    id: task.id,
    title: task.title,
    foundation: task.fund?.name ?? "Фонд",
    foundationId: task.fund_id,
    city: task.participation_format === "online" ? "Онлайн" : task.city ?? "Город уточняется",
    format: toTaskFormat(task.participation_format),
    commitment: toTaskCommitment(task.duration_type),
    category: task.category,
    proBono: task.task_type === "pro_bono",
    date: startsAt,
    deadline: formatDeadline(task.deadline_at),
    hours: Number(task.expected_hours),
    spots,
    filled: 0,
    status: toTaskStatus(task.status),
    skills,
    impact: task.requirements ?? `Помощь в категории «${getCategoryLabel(task.category)}».`,
    description: task.description,
    location: taskLocation(task),
    contact: {
      name: task.fund?.name ?? "Организатор",
      role: "Координатор задания",
      phone: "Контакты откроются после принятия"
    },
    requirements: requirements.length ? requirements : ["Ознакомиться с описанием задания", "Дождаться решения фонда после отклика"],
    instructions: [
      "Отправить отклик на задание",
      "Дождаться решения фонда",
      task.participation_format === "online" ? "Получить ссылку и инструкции после принятия" : "Получить место встречи и инструкции после принятия"
    ],
    timeline: [
      { time: startsAt, title: "Старт", description: "Время начала задания" },
      { time: formatDeadline(task.deadline_at), title: "Дедлайн отклика", description: "До этой даты фонд принимает заявки" }
    ]
  };
}

export function mapTaskToFoundation(task: VolunteerTask): Foundation {
  return {
    id: task.foundationId,
    name: task.foundation,
    focus: getCategoryLabel(task.category),
    city: task.city,
    activeTasks: 0,
    volunteersNeeded: task.spots,
    responseRate: 0,
    moderationStatus: "approved",
    curator: task.contact.name,
    reportsReady: 0
  };
}
