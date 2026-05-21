import { Building2, ShieldCheck, UserRound } from "lucide-react";
import type { DemoRole } from "@/widgets/auth/model/auth-types";

export const demoRoles: DemoRole[] = [
  { title: "Волонтёр", text: "Сотрудник Столото", helper: "volunteer@stoloto.local / password123", href: "/volunteer", registerHref: "/register/volunteer", login: "volunteer@stoloto.local", password: "password123", icon: UserRound },
  { title: "Фонд", text: "НКО и партнёры", helper: "fund@example.org / password123", href: "/foundation", registerHref: "/register/foundation", login: "fund@example.org", password: "password123", icon: Building2 },
  { title: "Админ", text: "Demo account", helper: "admin / admin", href: "/admin", registerHref: "/admin", login: "admin", password: "admin", icon: ShieldCheck }
];

export const interestOptions = ["Помощь детям", "Экология", "Животные", "Образование", "Пожилые люди", "События"];
export const skillOptions = ["Дизайн", "Презентации", "Социальные сети", "Аналитика", "Копирайтинг", "Планирование"];
