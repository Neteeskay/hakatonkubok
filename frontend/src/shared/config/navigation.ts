import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  FileBarChart,
  History,
  Inbox,
  ListChecks,
  PlusCircle,
  ShieldCheck,
  UsersRound
} from "lucide-react";

export type AppRole = "volunteer" | "foundation" | "admin";

export const roleLabels: Record<AppRole, string> = {
  volunteer: "Волонтёр",
  foundation: "Фонд",
  admin: "Администратор"
};

export const roleNavigation = {
  volunteer: [
    { label: "Лента / задания", href: "/volunteer", icon: ListChecks },
    { label: "Мои отклики", href: "/volunteer/applications", icon: Inbox, badge: "4" },
    { label: "История участия", href: "/volunteer/history", icon: History },
    { label: "Волонтёрские часы", href: "/volunteer/hours", icon: Clock },
    { label: "Уведомления", href: "/volunteer/notifications", icon: Bell, badge: "2" }
  ],
  foundation: [
    { label: "Dashboard", href: "/foundation", icon: BarChart3 },
    { label: "Мои задания", href: "/foundation/tasks", icon: ListChecks },
    { label: "Создать задание", href: "/foundation/create-task", icon: PlusCircle },
    { label: "Отклики", href: "/foundation/applications", icon: Inbox },
    { label: "Модерация", href: "/foundation/moderation", icon: ShieldCheck },
    { label: "Волонтёры", href: "/foundation/volunteers", icon: UsersRound },
    { label: "Отчёты", href: "/foundation/reports", icon: FileBarChart },
    { label: "Профиль фонда", href: "/foundation/profile", icon: Building2 }
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: BarChart3 },
    { label: "Фонды", href: "/admin/foundations", icon: Building2 },
    { label: "Модерация фондов", href: "/admin/moderation/foundations", icon: ShieldCheck },
    { label: "Задания", href: "/admin/tasks", icon: ListChecks },
    { label: "Модерация заданий", href: "/admin/moderation/tasks", icon: CheckCircle2 },
    { label: "Волонтёры", href: "/admin/volunteers", icon: UsersRound },
    { label: "Начисление часов", href: "/admin/hours", icon: Clock },
    { label: "Аналитика", href: "/admin/analytics", icon: BarChart3 },
    { label: "Отчёты", href: "/admin/reports", icon: FileBarChart }
  ]
} satisfies Record<AppRole, { label: string; href: string; icon: typeof BarChart3; badge?: string }[]>;
