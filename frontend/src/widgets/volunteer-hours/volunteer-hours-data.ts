import { CheckCircle2, Clock3, HelpCircle, ShieldCheck, Sparkles, Star, TimerReset, XCircle } from "lucide-react";

export type HourStatus = "confirmed" | "admin" | "foundation" | "rejected";

export const hourSummary = {
  total: 156,
  totalDays: 19,
  confirmed: 142,
  confirmedDays: 17,
  pending: 14,
  pendingDays: 2,
  month: 22,
  monthDelta: 8
};

export const hourDynamics = [
  { month: "Дек", hours: 12 },
  { month: "Янв", hours: 18 },
  { month: "Фев", hours: 24 },
  { month: "Мар", hours: 16 },
  { month: "Апр", hours: 28 },
  { month: "Май", hours: 36 },
  { month: "Июн", hours: 24 }
];

export const hourCategories = [
  { name: "Помощь животным", hours: 48, percent: 31, color: "#FFE300" },
  { name: "Экология", hours: 36, percent: 23, color: "#62c96b" },
  { name: "Социальная помощь", hours: 30, percent: 19, color: "#8a74df" },
  { name: "Образование", hours: 24, percent: 15, color: "#5aa8df" },
  { name: "Культура и спорт", hours: 18, percent: 12, color: "#f0778a" }
];

export const statusView: Record<HourStatus, { icon: typeof CheckCircle2; className: string; dotClassName: string }> = {
  confirmed: {
    icon: CheckCircle2,
    className: "bg-[#e8f8eb] text-[#247a31]",
    dotClassName: "bg-[#55bf63]"
  },
  admin: {
    icon: TimerReset,
    className: "bg-[#f0edff] text-[#6550c7]",
    dotClassName: "bg-[#8a74df]"
  },
  foundation: {
    icon: Clock3,
    className: "bg-brand/18 text-black",
    dotClassName: "bg-brand"
  },
  rejected: {
    icon: XCircle,
    className: "bg-[#fff0f0] text-[#c84242]",
    dotClassName: "bg-[#e55a5a]"
  }
};

export const hourAccruals = [
  {
    id: "animal-shelter",
    task: "Помощь в приюте для животных",
    foundation: "Фонд «Лапа добра»",
    date: "8 июня 2024",
    status: "confirmed",
    statusLabel: "Часы подтверждены",
    description: "Уборка территории, выгул собак и помощь в уходе за питомцами.",
    hours: 6
  },
  {
    id: "presentation",
    task: "Создание презентации для фонда",
    foundation: "Фонд «Добрые руки»",
    date: "10 июня 2024",
    status: "admin",
    statusLabel: "Ожидает начисления администратором",
    description: "Фонд подтвердил результат, администратор проверяет часы.",
    hours: 2
  },
  {
    id: "park",
    task: "Субботник в парке",
    foundation: "Фонд «Зелёная планета»",
    date: "31 мая 2024",
    status: "foundation",
    statusLabel: "Ожидает подтверждения фондом",
    description: "Участие завершено, координатор сверяет список участников.",
    hours: 4
  },
  {
    id: "elderly",
    task: "Помощь пожилым людям",
    foundation: "Фонд «Старость в радость»",
    date: "2 марта 2024",
    status: "rejected",
    statusLabel: "Часы не начислены",
    description: "Организатор отклонил участие: команда была набрана раньше.",
    hours: 0
  }
] satisfies Array<{
  id: string;
  task: string;
  foundation: string;
  date: string;
  status: HourStatus;
  statusLabel: string;
  description: string;
  hours: number;
}>;

export const hoursInfo = [
  {
    icon: ShieldCheck,
    title: "Часы начисляются только за реальные выполненные задания."
  },
  {
    icon: Sparkles,
    title: "Организатор может отклонить участие, если задание не было выполнено."
  }
];

export const hoursSteps = [
  "Вы выполняете задание или участвуете в мероприятии.",
  "Организатор подтверждает ваше участие.",
  "Часы начисляются на ваш счёт в течение 1–3 дней."
];

export const contributionNotes = [
  { icon: HelpCircle, label: "Поддержка" },
  { icon: Star, label: "Вклад" }
];
