import { CheckCircle2, Clock, FileText, HeartHandshake, Medal, MessageCircle } from "lucide-react";
import type { TaskStatus } from "@/entities/task/model";

export type ApplicationStatus = "idle" | "pending" | "accepted" | "rejected" | "completed" | "hours";
export type ParticipationCtaState = "apply" | "pending" | "accepted" | "rejected" | "completed" | "hours" | "full" | "closed";

export function getCtaState(status: TaskStatus, remaining: number, applicationStatus: ApplicationStatus = "idle"): ParticipationCtaState {
  if (applicationStatus !== "idle") return applicationStatus;
  if (status === "completed") return "closed";
  if (remaining <= 0) return "full";
  return "apply";
}

export function getParticipationProgress(state: ParticipationCtaState) {
  const progress: Record<ParticipationCtaState, number> = {
    apply: -1,
    pending: 1,
    accepted: 3,
    rejected: 1,
    completed: 4,
    hours: 5,
    full: -1,
    closed: -1
  };

  return progress[state];
}

export const participationSteps = [
  { title: "Отклик отправлен", text: "Вы отправляете заявку фонду.", icon: FileText },
  { title: "Решение фонда", text: "Фонд принимает или оставляет комментарий.", icon: Clock },
  { title: "Орг. информация", text: "Открываются контакты, чат и инструкции.", icon: MessageCircle },
  { title: "Участие", text: "Вы выполняете задачу в назначенное время.", icon: HeartHandshake },
  { title: "Подтверждение", text: "Фонд подтверждает факт участия.", icon: CheckCircle2 },
  { title: "Часы начислены", text: "После проверки часы попадают в профиль.", icon: Medal }
];

export const ctaLabels: Record<ParticipationCtaState, { label: string; helper: string }> = {
  apply: { label: "Откликнуться", helper: "Фонд ответит в течение 1 рабочего дня" },
  pending: { label: "Ожидает решения", helper: "Отклик отправлен. Координатор фонда проверяет заявку" },
  accepted: { label: "Вы приняты", helper: "Организационная информация доступна в уведомлениях" },
  rejected: { label: "Отклик отклонён", helper: "Фонд оставит комментарий в разделе «Мои отклики»" },
  completed: { label: "Участие завершено", helper: "Фонд подтверждает факт участия перед начислением часов" },
  hours: { label: "Часы подтверждены", helper: "Волонтёрские часы добавлены в профиль и отчётность" },
  full: { label: "Мест нет", helper: "Можно добавить задание в избранное и следить за новыми наборами" },
  closed: { label: "Набор закрыт", helper: "Задание завершено или снято с публикации" }
};
