import { Bell, CalendarClock, CheckCircle2, Clock3, Flag, MessageCircle, PencilLine, Star, XCircle, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { tasks } from "@/shared/config/mock-data";

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

export const featuredNotification = {
  title: "Ваш отклик принят!",
  label: "Радостная новость!",
  text: "Поздравляем! Фонд «Добрые руки» принял вас на задание «Создание презентации для фонда».",
  task: tasks[1],
  timeAgo: "5 мин назад",
  date: "15 мая 2026",
  time: "10:00 - 14:00",
  format: "Онлайн"
};

export const volunteerNotifications: VolunteerNotification[] = [
  {
    id: "notif-pending",
    title: "Ожидайте решения фонда",
    text: "Фонд «Лапа добра» рассматривает ваш отклик на задание «Помощь в приюте для животных». Мы сообщим вам в течение 2-3 дней.",
    time: "20 мая, 12:30",
    dateLabel: "Сегодня",
    unread: true,
    tone: "review",
    icon: MessageCircle,
    target: "application",
    task: tasks[0],
    actionLabel: "Открыть отклик"
  },
  {
    id: "notif-rejected",
    title: "Ваш отклик не принят",
    text: "К сожалению, фонд «Старость в радость» не смог принять вас на задание «Помощь пожилым людям». Есть комментарий фонда.",
    time: "18 мая, 09:15",
    dateLabel: "Вчера",
    unread: true,
    tone: "rejected",
    icon: XCircle,
    target: "application",
    task: tasks[4],
    actionLabel: "Посмотреть причину"
  },
  {
    id: "notif-changed",
    title: "Изменения в задании",
    text: "В задании «Субботник в парке» изменилось время проведения. Новая дата: 1 июня 2026, 11:00 - 15:00.",
    time: "17 мая, 16:45",
    dateLabel: "Вчера",
    unread: true,
    tone: "work",
    icon: CalendarClock,
    target: "task",
    task: tasks[2],
    actionLabel: "Смотреть задание"
  },
  {
    id: "notif-contacts",
    title: "Контакты организатора доступны",
    text: "Фонд добавил Telegram, WhatsApp и инструкцию по началу работы над презентацией. Можно связаться с координатором.",
    time: "16 мая, 14:20",
    dateLabel: "Ранее",
    unread: false,
    tone: "accepted",
    icon: CheckCircle2,
    target: "application",
    task: tasks[1],
    actionLabel: "Открыть контакты"
  },
  {
    id: "notif-hours",
    title: "Часы начислены",
    text: "4 волонтёрских часа добавлены за участие в сортировке наборов. Они уже отображаются в профиле и отчётах.",
    time: "15 мая, 18:00",
    dateLabel: "Ранее",
    unread: false,
    tone: "hours",
    icon: Star,
    target: "hours",
    task: tasks[3],
    actionLabel: "Мои часы"
  },
  {
    id: "notif-profile",
    title: "Добавьте pro bono навыки",
    text: "Заполните профессиональные навыки, чтобы получать больше заданий по дизайну, аналитике, презентациям и юридической помощи.",
    time: "14 мая, 11:10",
    dateLabel: "Ранее",
    unread: false,
    tone: "system",
    icon: PencilLine,
    target: "profile",
    actionLabel: "Заполнить профиль"
  }
];

export const notificationStatusCards = [
  { title: "На рассмотрении", text: "Фонд получил ваш отклик и рассматривает вашу кандидатуру. Ожидайте ответ в течение 1-3 дней.", tone: "review", icon: Clock3 },
  { title: "Принят", text: "Поздравляем! Вас приняли к участию в задании. Скоро появится вся организационная информация.", tone: "accepted", icon: CheckCircle2 },
  { title: "В работе", text: "Вы участвуете в задании. Следите за обновлениями в карточке задания и сообщениях.", tone: "work", icon: CalendarClock },
  { title: "Завершён", text: "Задание успешно выполнено. Ожидайте подтверждение от фонда и начисление часов.", tone: "completed", icon: Flag },
  { title: "Часы начислены", text: "Волонтёрские часы начислены на ваш счёт. Спасибо за вашу помощь!", tone: "hours", icon: Star }
] satisfies { title: string; text: string; tone: NotificationTone; icon: LucideIcon }[];

export const notificationSettings = [
  { title: "Отклики и статусы", enabled: true },
  { title: "Комментарии фондов", enabled: true },
  { title: "Изменения заданий", enabled: true },
  { title: "Волонтёрские часы", enabled: true },
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

export const notificationIcons = { Bell };
