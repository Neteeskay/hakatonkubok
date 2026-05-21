import type { VolunteerTask } from "@/entities/task/model";

export type RecruitmentTone = "open" | "almost" | "full" | "closed";

export interface RecruitmentState {
  label: string;
  helper: string;
  tone: RecruitmentTone;
  remaining: number;
  progress: number;
}

export function getRecruitmentState(task: VolunteerTask): RecruitmentState {
  const remaining = Math.max(task.spots - task.filled, 0);
  const progress = Math.min(Math.round((task.filled / task.spots) * 100), 100);

  if (task.status === "completed") {
    return { label: "Набор завершён", helper: "Активность закрыта", tone: "closed", remaining, progress: 100 };
  }

  if (remaining === 0) {
    return { label: "Мест нет", helper: `${task.filled} из ${task.spots} участников`, tone: "full", remaining, progress: 100 };
  }

  if (remaining <= 3 || progress >= 80) {
    return { label: "Почти заполнено", helper: `Осталось ${remaining} места`, tone: "almost", remaining, progress };
  }

  return { label: "Набор открыт", helper: `Осталось ${remaining} мест`, tone: "open", remaining, progress };
}

export function recruitmentToneClass(tone: RecruitmentTone) {
  const variants: Record<RecruitmentTone, string> = {
    open: "bg-[#e8f8e8] text-[#247a31]",
    almost: "bg-brand/20 text-black",
    full: "bg-[#f4f3ee] text-black/54",
    closed: "bg-[#ffe8e8] text-[#c83c3c]"
  };
  return variants[tone];
}
