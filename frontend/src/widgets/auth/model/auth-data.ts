import { Building2, ShieldCheck, UserRound } from "lucide-react";
import type { DemoRole } from "@/widgets/auth/model/auth-types";

export const demoRoles: DemoRole[] = [
  { title: "Волонтёр", text: "Сотрудник Столото", helper: "Лента, отклики, часы и профиль", href: "/volunteer", registerHref: "/register/volunteer", icon: UserRound },
  { title: "Фонд", text: "НКО и партнёры", helper: "Задания, заявки и отчёты", href: "/foundation", registerHref: "/register/foundation", icon: Building2 },
  { title: "Админ", text: "Demo account", helper: "Модерация, часы и аналитика", href: "/admin", registerHref: "/admin", icon: ShieldCheck }
];

export const interestOptions = ["Помощь детям", "Экология", "Животные", "Образование", "Пожилые люди", "События"];
export const skillOptions = ["Дизайн", "Презентации", "SMM", "Аналитика", "Копирайтинг", "Планирование"];
