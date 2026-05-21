import { Bell, CalendarClock, CheckCircle2, Clock3, Flag, PencilLine, Star, XCircle, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";

export type NotificationTone = "review" | "accepted" | "work" | "completed" | "hours" | "rejected" | "system";
export type NotificationTarget = "task" | "application" | "profile" | "hours";

export interface VolunteerNotification {
  id: string;
  title: string;
  text: string;
  time: string;
  dateLabel: "Сегодня" | "Вчера" | "Ранее";
  unread: boolean;
  tone: NotificationTone;
  icon: LucideIcon;
  target: NotificationTarget;
  task?: VolunteerTask;
  actionLabel: string;
}

export const notificationTabs = [
  { label: "Все", value: "all" },
  { label: "Непрочитанные", value: "unread" },
  { label: "Архив", value: "archive" }
] as const;

export const notificationStatusCards = [
  { title: "На рассмотрении", text: "Фонд получил ваш отклик и рассматривает вашу кандидатуру.", tone: "review", icon: Clock3 },
  { title: "Принят", text: "Вас приняли к участию в задании. Организационная информация открыта.", tone: "accepted", icon: CheckCircle2 },
  { title: "В работе", text: "Вы участвуете в задании. Следите за обновлениями в карточке.", tone: "work", icon: CalendarClock },
  { title: "Завершен", text: "Задание выполнено. Ожидается подтверждение от фонда.", tone: "completed", icon: Flag },
  { title: "Часы начислены", text: "Волонтерские часы начислены на ваш счет.", tone: "hours", icon: Star }
] satisfies { title: string; text: string; tone: NotificationTone; icon: LucideIcon }[];

export const notificationSettings = [
  { title: "Отклики и статусы", enabled: true },
  { title: "Комментарии фондов", enabled: true },
  { title: "Изменения заданий", enabled: true },
  { title: "Волонтерские часы", enabled: true },
  { title: "Системные подсказки", enabled: false }
];

export const notificationToneStyles: Record<NotificationTone, { icon: string; surface: string; dot: string; text: string }> = {
  review: { icon: "bg-[#e9efff] text-[#315ed1]", surface: "bg-[#f7f9ff]", dot: "bg-[#6a98ff]", text: "text-[#315ed1]" },
  accepted: { icon: "bg-[#e6f8e9] text-[#247a31]", surface: "bg-[#f4fcf5]", dot: "bg-[#3dbb55]", text: "text-[#247a31]" },
  work: { icon: "bg-[#eee9ff] text-[#6b4de6]", surface: "bg-[#f7f4ff]", dot: "bg-[#7b61ff]", text: "text-[#6b4de6]" },
  completed: { icon: "bg-[#e6f8ef] text-[#237650]", surface: "bg-[#f4fcf8]", dot: "bg-[#39aa74]", text: "text-[#237650]" },
  hours: { icon: "bg-brand/18 text-black", surface: "bg-[#fffdf2]", dot: "bg-brand", text: "text-black" },
  rejected: { icon: "bg-[#ffe8e8] text-[#c83c3c]", surface: "bg-[#fff6f6]", dot: "bg-[#ec4b4b]", text: "text-[#c83c3c]" },
  system: { icon: "bg-[#f1f0eb] text-black/62", surface: "bg-[#fbfaf5]", dot: "bg-black/38", text: "text-black/62" }
};

export const notificationIcons = { Bell, CheckCircle2, Clock3, Star, XCircle, PencilLine };
