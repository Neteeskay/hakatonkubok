import { BarChart3, CheckCircle2, Clock3, FileText, Inbox, RotateCcw, ShieldCheck, UsersRound, XCircle, type LucideIcon } from "lucide-react";
import { foundations, tasks } from "@/shared/config/mock-data";

export type FoundationTaskStatus = "moderation" | "published" | "returned" | "rejected" | "completed" | "draft";
export type FoundationApplicationStatus = "review" | "accepted" | "clarify" | "rejected" | "completed" | "confirmed" | "not_completed";
export type FoundationTone = "gold" | "green" | "blue" | "violet" | "red" | "neutral";
export type FoundationContactVisibility = "after_acceptance" | "immediate";

export interface FoundationTaskContact {
  telegram: string;
  whatsapp: string;
  email: string;
  phone: string;
  chatLink: string;
  instruction: string;
}

export interface FoundationTaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  format: "Онлайн" | "Офлайн" | "Гибрид";
  deadline: string;
  period: string;
  participants: number;
  capacity: number;
  responses: number;
  hours: number;
  status: FoundationTaskStatus;
  moderationComment?: string;
  contactVisibility: FoundationContactVisibility;
  contacts: FoundationTaskContact;
  taskId: string;
}

export interface FoundationApplicationItem {
  id: string;
  volunteer: string;
  role: string;
  city: string;
  avatar: string;
  taskTitle: string;
  skills: string[];
  proBonoSkills: string[];
  interests: string[];
  hoursHistory: number;
  completedActivities: number;
  status: FoundationApplicationStatus;
  comment: string;
  nextStep: string;
  appliedAt: string;
  relevance: number;
  attendanceDecision: "pending" | "participated" | "missed" | "done";
  taskId: string;
}

const defaultTaskContacts: FoundationTaskContact = {
  telegram: "@sportdobro_help",
  whatsapp: "+7 900 120-45-67",
  email: "volunteer@sport-dobro.ru",
  phone: "+7 495 120-45-67",
  chatLink: "https://t.me/sportdobro_team",
  instruction: "После назначения координатор добавит волонтёра в рабочий чат и отправит короткий бриф."
};

export const currentFoundation = {
  ...foundations[0],
  description: "Фонд помогает семьям, детям и городским инициативам через спортивные события, образовательные программы и волонтёрские активности.",
  legal: "ИНН 7701234567 / ОГРН 1127700000000",
  website: "sport-dobro.ru",
  socials: "@sportdobro",
  moderationStatus: "approved" as const,
  trust: "Проверенная организация",
  categories: ["Спорт", "Семьи", "События", "Образование"],
  helpDirections: ["Сопровождение мероприятий", "Логистика", "Наставничество", "Pro bono материалы"]
};

export const foundationTasks: FoundationTaskItem[] = [
  {
    id: "ft-001",
    taskId: "task-001",
    title: tasks[0].title,
    description: tasks[0].description,
    category: "Спорт и семьи",
    city: "Москва",
    format: "Офлайн",
    deadline: "до 22 мая",
    period: "24 мая, 10:00 - 14:00",
    participants: 12,
    capacity: 18,
    responses: 21,
    hours: 5,
    status: "published",
    contactVisibility: "after_acceptance",
    contacts: defaultTaskContacts
  },
  {
    id: "ft-002",
    taskId: "task-002",
    title: tasks[1].title,
    description: tasks[1].description,
    category: "Pro bono",
    city: "Онлайн",
    format: "Онлайн",
    deadline: "до 25 мая",
    period: "27-29 мая",
    participants: 2,
    capacity: 4,
    responses: 7,
    hours: 3,
    status: "moderation",
    contactVisibility: "after_acceptance",
    contacts: {
      ...defaultTaskContacts,
      telegram: "@sportdobro_design",
      instruction: "После назначения координатор пришлёт материалы фонда, бренд-папку и ссылку на рабочий созвон."
    }
  },
  {
    id: "ft-003",
    taskId: "task-003",
    title: tasks[2].title,
    description: tasks[2].description,
    category: "Образование",
    city: "Санкт-Петербург",
    format: "Гибрид",
    deadline: "до 28 мая",
    period: "30 мая - 13 июня",
    participants: 7,
    capacity: 10,
    responses: 14,
    hours: 8,
    status: "returned",
    contactVisibility: "immediate",
    contacts: {
      ...defaultTaskContacts,
      chatLink: "https://t.me/sportdobro_teens",
      instruction: "Можно сразу написать координатору и уточнить расписание первой онлайн-встречи."
    },
    moderationComment: "Добавьте контакты после отклика и уточните формат материалов для подростков."
  },
  {
    id: "ft-004",
    taskId: "task-004",
    title: tasks[3].title,
    description: tasks[3].description,
    category: "Помощь приютам",
    city: "Казань",
    format: "Офлайн",
    deadline: "завершено",
    period: "1 июня",
    participants: 16,
    capacity: 16,
    responses: 23,
    hours: 4,
    status: "completed",
    contactVisibility: "after_acceptance",
    contacts: defaultTaskContacts
  },
  {
    id: "ft-005",
    taskId: "task-005",
    title: tasks[4].title,
    description: tasks[4].description,
    category: "Pro bono",
    city: "Онлайн",
    format: "Онлайн",
    deadline: "до 30 мая",
    period: "июнь, по договорённости",
    participants: 1,
    capacity: 3,
    responses: 5,
    hours: 6,
    status: "published",
    contactVisibility: "after_acceptance",
    contacts: {
      ...defaultTaskContacts,
      telegram: "@sportdobro_data",
      instruction: "После назначения фонд откроет доступ к обезличенным данным и чек-листу аудита."
    }
  }
];

export const foundationApplications: FoundationApplicationItem[] = [
  {
    id: "fa-001",
    volunteer: "Анна Соколова",
    role: "Продуктовый дизайнер",
    city: "Москва",
    avatar: "/avatars/avatar-anna.png",
    taskTitle: tasks[1].title,
    skills: ["Презентации", "Product Design", "Копирайтинг"],
    proBonoSkills: ["Figma", "UX/UI"],
    interests: ["Дети", "Образование", "Pro bono"],
    hoursHistory: 56,
    completedActivities: 12,
    status: "review",
    comment: "Подходит по опыту, нужно уточнить сроки первого черновика.",
    nextStep: "Принять решение и оставить комментарий для волонтёра",
    appliedAt: "20 мая, 12:40",
    relevance: 92,
    attendanceDecision: "pending",
    taskId: "task-002"
  },
  {
    id: "fa-002",
    volunteer: "Илья Мельников",
    role: "Event-координатор",
    city: "Москва",
    avatar: "/avatars/avatar-ilya.png",
    taskTitle: tasks[0].title,
    skills: ["Логистика", "События", "Работа с семьями"],
    proBonoSkills: ["Project Management"],
    interests: ["Семьи", "Спорт", "События"],
    hoursHistory: 34,
    completedActivities: 7,
    status: "accepted",
    comment: "Принят в команду регистрации. Контакты отправлены волонтёру.",
    nextStep: "Дождаться активности и подтвердить факт участия",
    appliedAt: "19 мая, 16:10",
    relevance: 86,
    attendanceDecision: "pending",
    taskId: "task-001"
  },
  {
    id: "fa-003",
    volunteer: "Мария Титова",
    role: "Аналитик",
    city: "Онлайн",
    avatar: "/avatars/avatar-maria.png",
    taskTitle: tasks[4].title,
    skills: ["Аналитика", "BI", "Data Analysis"],
    proBonoSkills: ["Аудит анкет"],
    interests: ["ОВЗ", "Данные", "Pro bono"],
    hoursHistory: 82,
    completedActivities: 18,
    status: "clarify",
    comment: "Нужно запросить NDA и подтвердить опыт с чувствительными данными.",
    nextStep: "Запросить уточнение перед принятием заявки",
    appliedAt: "18 мая, 09:25",
    relevance: 78,
    attendanceDecision: "pending",
    taskId: "task-005"
  },
  {
    id: "fa-004",
    volunteer: "Павел Ким",
    role: "Волонтёр событий",
    city: "Казань",
    avatar: "/avatars/avatar-pavel.png",
    taskTitle: tasks[3].title,
    skills: ["Логистика", "Склад", "Командная работа"],
    proBonoSkills: [],
    interests: ["Приюты", "Логистика", "Офлайн"],
    hoursHistory: 18,
    completedActivities: 4,
    status: "confirmed",
    comment: "Факт участия подтверждён фондом. Активность закрыта.",
    nextStep: "Участие закрыто и передано в следующий этап обработки",
    appliedAt: "14 мая, 11:05",
    relevance: 81,
    attendanceDecision: "participated",
    taskId: "task-004"
  }
];

export const foundationMetrics = [
  { label: "Активные задания", value: "6", helper: "2 на модерации", icon: FileText, tone: "gold" },
  { label: "Отклики", value: "27", helper: "9 требуют ответа", icon: Inbox, tone: "blue" },
  { label: "Принятые волонтёры", value: "42", helper: "за текущий месяц", icon: UsersRound, tone: "green" },
  { label: "Подтверждённые часы", value: "184", helper: "после закрытия активностей", icon: ShieldCheck, tone: "violet" }
] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: FoundationTone }[];

export const reportMetrics = [
  { label: "Завершённые задания", value: "18", helper: "+4 за месяц", icon: CheckCircle2, tone: "green" },
  { label: "Средний отклик", value: "2,4 дн.", helper: "до решения фонда", icon: Clock3, tone: "blue" },
  { label: "Эффективность набора", value: "86%", helper: "заполнение мест", icon: BarChart3, tone: "gold" },
  { label: "Ожидают подтверждения", value: "7", helper: "после активности", icon: RotateCcw, tone: "violet" }
] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: FoundationTone }[];

export const taskStatusConfig: Record<FoundationTaskStatus, { label: string; tone: FoundationTone; icon: LucideIcon; helper: string }> = {
  draft: { label: "Черновик", tone: "neutral", icon: FileText, helper: "Можно редактировать" },
  moderation: { label: "На модерации", tone: "blue", icon: Clock3, helper: "Ожидает проверки" },
  published: { label: "Опубликовано", tone: "green", icon: CheckCircle2, helper: "Видно волонтёрам" },
  returned: { label: "На доработке", tone: "violet", icon: RotateCcw, helper: "Нужны правки" },
  rejected: { label: "Отклонено", tone: "red", icon: XCircle, helper: "Не будет опубликовано" },
  completed: { label: "Завершено", tone: "neutral", icon: ShieldCheck, helper: "Активность закрыта" }
};

export const applicationStatusConfig: Record<FoundationApplicationStatus, { label: string; tone: FoundationTone; icon: LucideIcon; helper: string }> = {
  review: { label: "На рассмотрении", tone: "gold", icon: Clock3, helper: "Нужно принять решение" },
  accepted: { label: "Назначен", tone: "green", icon: CheckCircle2, helper: "Контакты доступны волонтёру" },
  clarify: { label: "Уточнения", tone: "violet", icon: RotateCcw, helper: "Запросите детали" },
  rejected: { label: "Отклонён", tone: "red", icon: XCircle, helper: "С комментарием фонда" },
  completed: { label: "Завершено", tone: "neutral", icon: ShieldCheck, helper: "Ожидает подтверждения" },
  confirmed: { label: "Выполнено", tone: "green", icon: ShieldCheck, helper: "Активность закрыта фондом" },
  not_completed: { label: "Не выполнено", tone: "red", icon: XCircle, helper: "Закрыто с комментарием" }
};

export const foundationToneStyles: Record<FoundationTone, { surface: string; icon: string; badge: string; text: string }> = {
  gold: { surface: "bg-brand/12", icon: "bg-brand text-black", badge: "bg-brand/20 text-black", text: "text-black" },
  green: { surface: "bg-[#f0fbf1]", icon: "bg-[#e1f7e5] text-[#247a31]", badge: "bg-[#e6f8e9] text-[#247a31]", text: "text-[#247a31]" },
  blue: { surface: "bg-[#f7f9ff]", icon: "bg-[#e9efff] text-[#315ed1]", badge: "bg-[#e9efff] text-[#315ed1]", text: "text-[#315ed1]" },
  violet: { surface: "bg-[#f7f4ff]", icon: "bg-[#eee9ff] text-[#6b4de6]", badge: "bg-[#eee9ff] text-[#6b4de6]", text: "text-[#6b4de6]" },
  red: { surface: "bg-[#fff6f6]", icon: "bg-[#ffe8e8] text-[#c83c3c]", badge: "bg-[#ffe8e8] text-[#c83c3c]", text: "text-[#c83c3c]" },
  neutral: { surface: "bg-[#fbfaf4]", icon: "bg-[#f1efe7] text-black/62", badge: "bg-[#f4f3ee] text-black/62", text: "text-black/62" }
};

export const moderationComments = [
  "Уточните точку встречи для спортивного дня и добавьте запасной контакт.",
  "В pro bono задании нужно описать, как волонтёр получит материалы после принятия.",
  "Задачи со сбором денег не публикуются. Переформулируйте в формат помощи делом."
];
