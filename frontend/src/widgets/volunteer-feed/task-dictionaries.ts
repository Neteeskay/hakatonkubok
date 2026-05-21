import type { TaskCommitment, TaskFormat, TaskStatus } from "@/entities/task/model";
import { resolveApiFileUrl } from "@/shared/api/config";
import type { HelpCategoryResponse } from "@/shared/api/types";

export const fallbackCategoryOptions: HelpCategoryResponse[] = [
  { value: "children", label: "Дети" },
  { value: "elderly", label: "Пожилые" },
  { value: "disability", label: "Люди с ОВЗ" },
  { value: "ecology", label: "Экология" }
];

export const categoryLabels: Record<string, string> = {
  ...Object.fromEntries(fallbackCategoryOptions.map((item) => [item.value, item.label])),
  animals: "Помощь животным",
  communications: "Коммуникации",
  content: "Контент",
  design: "Дизайн",
  education: "Образование",
  events: "События",
  it: "IT / разработка",
  legal: "Юридическая помощь",
  logistics: "Логистика",
  probono: "Pro Bono",
  pro_bono: "Pro Bono",
  sport: "Спорт",
  targeted_help: "Адресная помощь"
};

export const formatLabels: Record<TaskFormat, string> = {
  onsite: "Офлайн",
  online: "Онлайн",
  hybrid: "Гибрид"
};

export const commitmentLabels: Record<TaskCommitment, string> = {
  "one-time": "Разовые",
  regular: "Регулярные",
  "long-term": "Долгосрочные"
};

export const skillLabels: Record<string, string> = {
  bi: "Визуализация данных",
  copywriting: "Копирайтинг",
  data_analysis: "Аналитика данных",
  figma: "Прототипирование",
  events: "События",
  hr: "Подбор команды",
  marketing: "Маркетинг",
  media: "Медиа",
  logistics: "Логистика",
  mentoring: "Наставничество",
  photoshop: "Обработка изображений",
  design: "Дизайн",
  analytics: "Аналитика",
  project_management: "Управление проектами",
  product_design: "Дизайн продукта",
  smm: "Социальные сети",
  ux_ui: "Дизайн интерфейсов"
};

export function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

export function getSkillLabel(skill: string) {
  return skillLabels[skill] ?? skillLabels[skill.toLowerCase().replace(/[\s/-]+/g, "_")] ?? skill;
}

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

const fallbackTaskVisuals = [
  taskVisuals["task-001"],
  taskVisuals["task-002"],
  taskVisuals["task-003"],
  taskVisuals["task-004"],
  { image: "/tasks/1.jpg", badge: "Волонтёры", tone: "from-[#e8f8eb] to-white" },
  { image: "/tasks/4.jpg", badge: "Помощь", tone: "from-[#f7f9ff] to-white" }
];

export function getTaskVisual(taskId: string, imageUrl?: string | null) {
  const uploadedImage = resolveApiFileUrl(imageUrl);
  if (uploadedImage) {
    const fallback = taskVisuals[taskId] ?? fallbackTaskVisuals[0];
    return { ...fallback, image: uploadedImage };
  }

  if (taskVisuals[taskId]) return taskVisuals[taskId];

  const hash = Array.from(taskId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackTaskVisuals[hash % fallbackTaskVisuals.length];
}
