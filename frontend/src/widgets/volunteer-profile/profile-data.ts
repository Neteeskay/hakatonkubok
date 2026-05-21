import { Award, CalendarCheck, CheckCircle2, Clock, Flame, Heart, Leaf, Medal, Star, UsersRound } from "lucide-react";

export const profileStats = [
  { icon: Clock, value: "0", label: "часов помощи", helper: "Данные загружаются из backend", progress: 0 },
  { icon: CalendarCheck, value: "0", label: "заданий выполнено", helper: "По истории участия", progress: 0 },
  { icon: UsersRound, value: "0", label: "фондов поддержано", helper: "По вашим откликам", progress: 0 },
  { icon: Flame, value: "0", label: "дней активности", helper: "По истории событий", progress: 0 }
];

export const profileBadges = [
  { icon: Heart, title: "Первые шаги", text: "старт", tone: "gold" },
  { icon: Star, title: "Надежный", text: "участие", tone: "dark" },
  { icon: UsersRound, title: "Командный игрок", text: "команда", tone: "gold" },
  { icon: Leaf, title: "Эко-помощник", text: "экология", tone: "dark" }
];

export const profileAchievements = [
  { icon: Clock, title: "Часы помощи", text: "Прогресс приходит из backend", value: "0 / 0", done: false, tone: "gold" },
  { icon: UsersRound, title: "Командный игрок", text: "Участия в командных заданиях", value: "0 / 0", done: false, tone: "violet" },
  { icon: Leaf, title: "Забота об экологии", text: "Экологические инициативы", value: "0 / 0", done: false, tone: "green" }
];

export const hoursByMonth = [
  { month: "-", value: 0 }
];

export const profileRows: {
  task: { id: string; title: string; foundation: string };
  status: string;
  period: string;
  hours: string;
  tone: string;
}[] = [];

export const profileTimeline = [
  { title: "Профиль подключен", text: "Данные пользователя получены из backend", time: "сейчас", icon: CheckCircle2 },
  { title: "История участия", text: "Отклики и часы доступны в отдельных разделах", time: "backend", icon: Medal },
  { title: "Достижения", text: "Прогресс синхронизируется через API", time: "backend", icon: Award }
];
