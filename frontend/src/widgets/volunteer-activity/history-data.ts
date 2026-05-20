import { CalendarCheck2, Check, Clock3, Star, UsersRound, X, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { tasks } from "@/shared/config/mock-data";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

export type HistoryStatus = "pending" | "accepted" | "in-progress" | "completed" | "hours" | "rejected";

export interface VolunteerHistoryEntry {
  id: string;
  task: VolunteerTask;
  status: HistoryStatus;
  detailStatus: ApplicationStatus;
  date: string;
  year: string;
  completedAt: string;
  confirmedAt?: string;
  hours: number;
  description: string;
  formatLabel: string;
  result: string;
}

export const historyFilters = [
  { label: "Все", value: "all" },
  { label: "Завершённые", value: "completed" },
  { label: "Подтверждённые", value: "hours" },
  { label: "Ожидают подтверждения", value: "pending" }
] as const;

export const historySummary = [
  { value: "156", label: "волонтёрских часов", helper: "= 19 дней помощи", tone: "gold", icon: Clock3 },
  { value: "24", label: "задания выполнено", helper: "в 8 городах", tone: "green", icon: CalendarCheck2 },
  { value: "7", label: "фондов и организаций", helper: "вы помогли", tone: "violet", icon: UsersRound },
  { value: "12", label: "благодарностей", helper: "от организаций", tone: "cream", icon: Star }
] satisfies { value: string; label: string; helper: string; tone: HistoryTone; icon: LucideIcon }[];

export const historyEntries: VolunteerHistoryEntry[] = [
  {
    id: "history-animals",
    task: tasks[0],
    status: "hours",
    detailStatus: "hours",
    date: "8 июня",
    year: "2026",
    completedAt: "8 июня 2026",
    confirmedAt: "8 июня 2026",
    hours: 6,
    description: "Уборка территории, выгул собак, помощь в уходе за животными.",
    formatLabel: "Офлайн",
    result: "Участие подтверждено фондом, часы начислены."
  },
  {
    id: "history-park",
    task: tasks[2],
    status: "hours",
    detailStatus: "hours",
    date: "31 мая",
    year: "2026",
    completedAt: "31 мая 2026",
    confirmedAt: "31 мая 2026",
    hours: 4,
    description: "Посадка деревьев, уборка мусора на территории парка.",
    formatLabel: "Офлайн",
    result: "Часы подтверждены после проверки участия."
  },
  {
    id: "history-kits",
    task: tasks[3],
    status: "completed",
    detailStatus: "completed",
    date: "15 мая",
    year: "2026",
    completedAt: "15 мая 2026",
    confirmedAt: "31 мая 2026",
    hours: 3,
    description: "Фасовка и сортировка продуктовых наборов для маломобильных семей.",
    formatLabel: "Офлайн",
    result: "Фонд подтвердил участие, часы готовятся к начислению."
  },
  {
    id: "history-presentation",
    task: tasks[1],
    status: "pending",
    detailStatus: "accepted",
    date: "10 мая",
    year: "2026",
    completedAt: "10 мая 2026",
    hours: 2,
    description: "Разработка презентации о деятельности фонда для отчётного собрания.",
    formatLabel: "Онлайн, pro bono",
    result: "Ожидается подтверждение фонда в течение 1-3 дней."
  },
  {
    id: "history-elderly",
    task: tasks[4],
    status: "rejected",
    detailStatus: "rejected",
    date: "2 мая",
    year: "2026",
    completedAt: "2 мая 2026",
    hours: 0,
    description: "Организатор отклонил ваш отклик. Можно выбрать другие задания фонда.",
    formatLabel: "Онлайн",
    result: "Часы не начислены."
  }
];

export const monthlyActivity = [
  { month: "Янв", hours: 28 },
  { month: "Фев", hours: 26 },
  { month: "Мар", hours: 29 },
  { month: "Апр", hours: 27 },
  { month: "Май", hours: 30 },
  { month: "Июн", hours: 22 }
];

export const cityContribution = [
  { city: "Москва", hours: 56 },
  { city: "Санкт-Петербург", hours: 42 },
  { city: "Казань", hours: 20 },
  { city: "Онлайн", hours: 18 },
  { city: "Екатеринбург", hours: 12 }
];

export type HistoryTone = "gold" | "green" | "violet" | "cream" | "blue" | "red";

export const historyToneStyles: Record<HistoryTone, { surface: string; icon: string; text: string; dot: string }> = {
  gold: { surface: "bg-brand/12", icon: "bg-brand/22 text-black", text: "text-black", dot: "bg-brand" },
  green: { surface: "bg-[#f0fbf1]", icon: "bg-[#e1f7e5] text-[#247a31]", text: "text-[#247a31]", dot: "bg-[#5cbd6a]" },
  violet: { surface: "bg-[#f5f1ff]", icon: "bg-[#eee9ff] text-[#6b4de6]", text: "text-[#6b4de6]", dot: "bg-[#7b61ff]" },
  cream: { surface: "bg-[#fffdf7]", icon: "bg-brand/14 text-black", text: "text-black", dot: "bg-brand" },
  blue: { surface: "bg-[#f7f9ff]", icon: "bg-[#e9efff] text-[#315ed1]", text: "text-[#315ed1]", dot: "bg-[#6a98ff]" },
  red: { surface: "bg-[#fff6f6]", icon: "bg-[#ffe8e8] text-[#c83c3c]", text: "text-[#c83c3c]", dot: "bg-[#ec4b4b]" }
};

export const historyStatusConfig: Record<HistoryStatus, { label: string; helper: string; tone: HistoryTone; icon: LucideIcon }> = {
  pending: { label: "Ожидает подтверждения", helper: "ожидается", tone: "violet", icon: Clock3 },
  accepted: { label: "Принят", helper: "контакты доступны", tone: "blue", icon: Check },
  "in-progress": { label: "В процессе", helper: "в работе", tone: "violet", icon: Clock3 },
  completed: { label: "Завершено", helper: "часы подтверждены", tone: "green", icon: Check },
  hours: { label: "Завершено", helper: "часы подтверждены", tone: "green", icon: Check },
  rejected: { label: "Отклонено", helper: "часы не начислены", tone: "red", icon: X }
};
