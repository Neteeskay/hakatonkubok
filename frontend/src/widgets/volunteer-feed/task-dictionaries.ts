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
  "task-001": { image: "/peoples.png", badge: "Новое", tone: "from-[#fff7bf] to-white" },
  "task-002": { image: "/backTaskVolounteer.png", badge: "Pro bono", tone: "from-[#f3f0e8] to-white" },
  "task-003": { image: "/backroundAddPeoplemain.png", badge: "Подходит вам", tone: "from-[#fff3a6] to-white" },
  "task-004": { image: "/peoples.png", badge: "Офлайн", tone: "from-[#fff8d7] to-white" },
  "task-005": { image: "/heart.png", badge: "Pro bono", tone: "from-[#fff0a8] to-white" }
};
