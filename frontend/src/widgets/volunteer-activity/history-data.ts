import { CalendarCheck2, Check, Clock3, Star, UsersRound, X, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
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
  { label: "Завершенные", value: "completed" },
  { label: "Подтвержденные", value: "hours" },
  { label: "Ожидают подтверждения", value: "pending" }
] as const;

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
  completed: { label: "Завершено", helper: "часы подтверждаются", tone: "green", icon: Check },
  hours: { label: "Завершено", helper: "часы начислены", tone: "green", icon: Check },
  rejected: { label: "Отклонено", helper: "часы не начислены", tone: "red", icon: X }
};

export const historySummaryIcons = {
  hours: Clock3,
  tasks: CalendarCheck2,
  funds: UsersRound,
  thanks: Star
};
