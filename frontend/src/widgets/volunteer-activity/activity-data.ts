import type { VolunteerTask } from "@/entities/task/model";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

export type VolunteerApplicationStage = "pending" | "accepted" | "in-progress" | "completed" | "hours" | "rejected";

export interface VolunteerApplicationItem {
  id: string;
  task: VolunteerTask;
  stage: VolunteerApplicationStage;
  detailStatus: ApplicationStatus;
  title: string;
  statusLabel: string;
  stageLabel: string;
  eventDate: string;
  appliedAt: string;
  deadline: string;
  progress: number;
  nextAction: string;
  message: string;
  foundationComment?: string;
  contactUnlocked: boolean;
  contact?: {
    name: string;
    role: string;
    email: string;
    phone: string;
    telegram: string;
    whatsapp: string;
    chat: string;
    instruction: string;
  };
}

export const statusFilters = [
  { label: "Все отклики", value: "all" },
  { label: "На рассмотрении", value: "pending" },
  { label: "Приняты", value: "accepted" },
  { label: "В работе", value: "in-progress" },
  { label: "Завершены", value: "completed" },
  { label: "Отклонены", value: "rejected" }
] as const;

export const applicationFlow = [
  { key: "sent", label: "Отклик отправлен", helper: "Заявка принята к рассмотрению организатором", tone: "gold" },
  { key: "pending", label: "На рассмотрении", helper: "Фонд рассматривает вашу заявку", tone: "blue" },
  { key: "accepted", label: "Принят", helper: "Вас приняли к участию", tone: "green" },
  { key: "in-progress", label: "В работе", helper: "Вы участвуете в выполнении задания", tone: "violet" },
  { key: "completed", label: "Завершен", helper: "Ожидается подтверждение от фонда", tone: "mint" },
  { key: "hours", label: "Часы начислены", helper: "Волонтерские часы начислены на ваш счет", tone: "cream" }
] as const;
