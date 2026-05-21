import type {
  VolunteerAchievementsOverviewResponse,
  VolunteerAchievementResponse
} from "@/shared/api/types";
import type { ComputedAchievement } from "@/widgets/volunteer-achievements/achievement-data";

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function achievementIcon(achievement: VolunteerAchievementResponse, fallbackIndex: number) {
  const sortOrder = achievement.sort_order ?? fallbackIndex + 1;
  const iconIndex = Math.max(1, Math.min(20, sortOrder));
  return `/bages/icon_${iconIndex}.png`;
}

export function mapAchievementResponseToComputed(
  achievement: VolunteerAchievementResponse,
  index = 0
): ComputedAchievement {
  const current = toNumber(achievement.progress_current);
  const target = Math.max(1, toNumber(achievement.progress_target));
  const progress = Math.min(100, Math.round(toNumber(achievement.progress_percent ?? (current / target) * 100)));
  const unlocked = achievement.is_awarded || Boolean(achievement.is_completed) || current >= target;
  const remaining = Math.max(0, toNumber(achievement.remaining ?? target - current));
  const unit = achievement.unit_label ?? achievement.unit ?? "";

  return {
    current,
    description: achievement.description,
    earnedAt: formatDate(achievement.awarded_at),
    humanProgress: `${Math.min(current, target)} из ${target}${unit ? ` ${unit}` : ""}`,
    icon: achievementIcon(achievement, index),
    id: achievement.code,
    metric: "legendScore",
    nextText: unlocked ? "Медаль уже получена" : `Осталось ${remaining}${unit ? ` ${unit}` : ""}`,
    progress,
    remaining,
    target,
    title: achievement.title,
    unit,
    unlocked
  };
}

export function mapAchievementsOverviewToComputed(overview: VolunteerAchievementsOverviewResponse) {
  return {
    achievements: overview.achievements.map(mapAchievementResponseToComputed),
    nextAchievement: overview.next_achievement ? mapAchievementResponseToComputed(overview.next_achievement) : null,
    stats: overview.stats
  };
}

export const emptyAchievement: ComputedAchievement = {
  current: 0,
  description: "",
  humanProgress: "0 из 1",
  icon: "/bages/icon_1.png",
  id: "empty",
  metric: "legendScore",
  nextText: "",
  progress: 0,
  remaining: 1,
  target: 1,
  title: "",
  unit: "",
  unlocked: false
};
