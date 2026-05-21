import { Award, CalendarCheck, CheckCircle2, Clock, Flame, Heart, Leaf, Medal, Star, UsersRound } from "lucide-react";
import { tasks, volunteers } from "@/shared/config/mock-data";

export const profileVolunteer = volunteers[0];

export const profileStats = [
  { icon: Clock, value: "56", label: "часов помощи", helper: "До следующего уровня 44 часа", progress: 56 },
  { icon: CalendarCheck, value: "12", label: "заданий выполнено", helper: "Продолжайте в том же духе", progress: 76 },
  { icon: UsersRound, value: "5", label: "фондов поддержано", helper: "Вы делаете мир лучше", progress: 62 },
  { icon: Flame, value: "8", label: "дней активности", helper: "Серия активных дней", progress: 80 }
];

export const profileBadges = [
  { icon: Heart, title: "Первые шаги", text: "10 часов", tone: "gold" },
  { icon: Star, title: "Надёжный", text: "25 часов", tone: "dark" },
  { icon: UsersRound, title: "Командный игрок", text: "5 заданий", tone: "gold" },
  { icon: Leaf, title: "Эко-помощник", text: "1 задание", tone: "dark" }
];

export const profileAchievements = [
  { icon: Clock, title: "Мастер помощи", text: "Наберите 50 часов волонтёрства", value: "56 / 50", done: true, tone: "gold" },
  { icon: UsersRound, title: "Командный игрок", text: "Участвуйте в 5 командных заданиях", value: "5 / 5", done: true, tone: "violet" },
  { icon: Leaf, title: "Забота об экологии", text: "Примите участие в экологических инициативах", value: "1 / 3", done: false, tone: "green" }
];

export const hoursByMonth = [
  { month: "Дек", value: 16 },
  { month: "Янв", value: 25 },
  { month: "Фев", value: 18 },
  { month: "Мар", value: 22 },
  { month: "Апр", value: 20 },
  { month: "Май", value: 12 }
];

export const profileRows = [
  { task: tasks[3], status: "Выполнено", period: "24 мая 2024\n10:00 - 14:00", hours: "4 ч", tone: "green" },
  { task: tasks[1], status: "Выполнено", period: "15 мая 2024\nОнлайн", hours: "6 ч", tone: "green" },
  { task: tasks[2], status: "Выполнено", period: "31 марта 2024\n11:00 - 15:00", hours: "4 ч", tone: "green" },
  { task: tasks[0], status: "Подтверждено фондом", period: "10 марта 2024\nОнлайн", hours: "2 ч", tone: "violet" },
  { task: tasks[4], status: "Отклонено", period: "2 марта 2024\n-", hours: "-", tone: "red" }
];

export const profileTimeline = [
  { title: "Заявка принята", text: "Фонд спорта подтвердил участие", time: "Сегодня, 12:40", icon: CheckCircle2 },
  { title: "Часы начислены", text: "4 часа добавлены в профиль", time: "Вчера, 18:20", icon: Medal },
  { title: "Новый бейдж", text: "Получен статус «Мастер помощи»", time: "15 мая", icon: Award }
];
