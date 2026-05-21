import type { TaskCategory, TaskCommitment, TaskFormat, TaskSkill, TaskStatus } from "@/entities/task/model";

export const categoryLabels: Record<TaskCategory, string> = {
  children: "Помощь детям",
  sport: "Спорт",
  ecology: "Экология",
  education: "Образование",
  animals: "Помощь животным",
  probono: "Pro bono",
  events: "События"
};

export const formatLabels: Record<TaskFormat, string> = {
  onsite: "Офлайн",
  online: "Онлайн",
  hybrid: "Гибрид"
};

export const commitmentLabels: Record<TaskCommitment, string> = {
  "one-time": "Разовое",
  regular: "Регулярно",
  "long-term": "Долгосрочно"
};

export const skillLabels: Record<TaskSkill, string> = {
  events: "События",
  media: "Медиа",
  logistics: "Логистика",
  mentoring: "Наставничество",
  design: "Дизайн",
  analytics: "Аналитика"
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  open: "Набор открыт",
  in_progress: "В работе",
  completed: "Завершено"
};

export const taskVisuals: Record<string, { image: string; badge: string; tone: string }> = {
  "task-001": { image: "/tasks/3.jpg", badge: "Новое", tone: "from-brand/20 to-white" },
  "task-002": { image: "/tasks/2.jpg", badge: "Pro bono", tone: "from-[#f3f0e8] to-white" },
  "task-003": { image: "/tasks/1.jpg", badge: "Подходит вам", tone: "from-brand/20 to-white" },
  "task-004": { image: "/tasks/4.jpg", badge: "Офлайн", tone: "from-brand/12 to-white" },
  "task-005": { image: "/tasks/2.jpg", badge: "Pro bono", tone: "from-brand/20 to-white" }
};
