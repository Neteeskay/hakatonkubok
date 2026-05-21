import { profileVolunteer } from "@/widgets/volunteer-profile/profile-data";

export type AchievementMetric =
  | "confirmedParticipations"
  | "hours"
  | "applications"
  | "fastApplications"
  | "activeSimultaneous"
  | "weeklyMonth"
  | "streakDays"
  | "onlineTasks"
  | "offlineTasks"
  | "proBonoTasks"
  | "ecoTasks"
  | "childrenTasks"
  | "supportTasks"
  | "reliability"
  | "teamTasks"
  | "legendScore";

export interface VolunteerAchievementSource {
  confirmedParticipations: number;
  hours: number;
  confirmedHours: number;
  applications: number;
  fastApplications: number;
  activeSimultaneous: number;
  weeklyMonth: number;
  streakDays: number;
  onlineTasks: number;
  offlineTasks: number;
  proBonoTasks: number;
  ecoTasks: number;
  childrenTasks: number;
  supportTasks: number;
  reliability: number;
  teamTasks: number;
  legendScore: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric: AchievementMetric;
  target: number;
  unit: string;
  earnedAt?: string;
}

export interface ComputedAchievement extends AchievementDefinition {
  current: number;
  unlocked: boolean;
  progress: number;
  remaining: number;
  humanProgress: string;
  nextText: string;
}

export const achievementSource: VolunteerAchievementSource = {
  confirmedParticipations: profileVolunteer.completedTasks,
  hours: 56,
  confirmedHours: 56,
  applications: 14,
  fastApplications: 2,
  activeSimultaneous: profileVolunteer.activeTaskIds.length,
  weeklyMonth: 4,
  streakDays: 8,
  onlineTasks: 6,
  offlineTasks: 7,
  proBonoTasks: 3,
  ecoTasks: 1,
  childrenTasks: 2,
  supportTasks: 1,
  reliability: 92,
  teamTasks: 5,
  legendScore: 42
};

export const achievementDefinitions: AchievementDefinition[] = [
  { id: "first-steps", title: "Первые шаги", description: "За первое подтверждённое участие.", icon: "/bages/icon_1.png", metric: "confirmedParticipations", target: 1, unit: "участие", earnedAt: "12 марта 2026" },
  { id: "five-hours", title: "5 часов добра", description: "За накопление 5 волонтёрских часов.", icon: "/bages/icon_2.png", metric: "hours", target: 5, unit: "часов", earnedAt: "18 марта 2026" },
  { id: "ten-hours", title: "10 часов помощи", description: "За достижение 10 подтверждённых часов.", icon: "/bages/icon_3.png", metric: "hours", target: 10, unit: "часов", earnedAt: "29 марта 2026" },
  { id: "twenty-five-hours", title: "25 часов добра", description: "За регулярное участие и 25 часов помощи.", icon: "/bages/icon_4.png", metric: "hours", target: 25, unit: "часов", earnedAt: "17 апреля 2026" },
  { id: "fifty-hours", title: "50 часов помощи", description: "За высокий уровень вовлечённости.", icon: "/bages/icon_5.png", metric: "hours", target: 50, unit: "часов", earnedAt: "14 мая 2026" },
  { id: "hundred-hours", title: "100 часов добра", description: "За крупный вклад в волонтёрскую программу.", icon: "/bages/icon_6.png", metric: "hours", target: 100, unit: "часов" },
  { id: "first-application", title: "Первый отклик", description: "За первый отклик на задание.", icon: "/bages/icon_7.png", metric: "applications", target: 1, unit: "отклик", earnedAt: "4 марта 2026" },
  { id: "fast-application", title: "Быстрый отклик", description: "Отклик в течение 1 часа.", icon: "/bages/icon_8.png", metric: "fastApplications", target: 1, unit: "быстрый отклик", earnedAt: "3 апреля 2026" },
  { id: "active-member", title: "Активный участник", description: "За участие в 5 заданиях одновременно.", icon: "/bages/icon_9.png", metric: "activeSimultaneous", target: 5, unit: "активных заданий" },
  { id: "weekly-helper", title: "Постоянный помощник", description: "За участие минимум раз в неделю в течение месяца.", icon: "/bages/icon_10.png", metric: "weeklyMonth", target: 4, unit: "недели", earnedAt: "30 апреля 2026" },
  { id: "good-marathon", title: "Марафон добра", description: "За активность 30 дней подряд.", icon: "/bages/icon_11.png", metric: "streakDays", target: 30, unit: "дней подряд" },
  { id: "online-volunteer", title: "Онлайн-волонтёр", description: "За выполнение 10 онлайн-заданий.", icon: "/bages/icon_12.png", metric: "onlineTasks", target: 10, unit: "онлайн-заданий" },
  { id: "offline-hero", title: "Офлайн-герой", description: "За участие в 10 офлайн-мероприятиях.", icon: "/bages/icon_13.png", metric: "offlineTasks", target: 10, unit: "офлайн-мероприятий" },
  { id: "pro-bono-expert", title: "PRO Bono Expert", description: "За выполнение профессиональных заданий.", icon: "/bages/icon_14.png", metric: "proBonoTasks", target: 5, unit: "pro bono заданий" },
  { id: "eco-hero", title: "Эко-герой", description: "За участие в экологических активностях.", icon: "/bages/icon_15.png", metric: "ecoTasks", target: 3, unit: "эко-активности" },
  { id: "children-good", title: "Добро детям", description: "За участие в заданиях категории «дети».", icon: "/bages/icon_16.png", metric: "childrenTasks", target: 3, unit: "задания детям" },
  { id: "support-near", title: "Поддержка рядом", description: "За помощь пожилым людям или людям с ОВЗ.", icon: "/bages/icon_17.png", metric: "supportTasks", target: 3, unit: "участия" },
  { id: "reliable-volunteer", title: "Надёжный волонтёр", description: "За высокий процент подтверждённых участий без отмен.", icon: "/bages/icon_18.png", metric: "reliability", target: 90, unit: "% подтверждений", earnedAt: "20 мая 2026" },
  { id: "team-player", title: "Командный игрок", description: "За участие в коллективных мероприятиях.", icon: "/bages/icon_19.png", metric: "teamTasks", target: 5, unit: "командных задач", earnedAt: "22 мая 2026" },
  { id: "prosto-legend", title: "Легенда проСТО", description: "За долгосрочную активность и системный вклад.", icon: "/bages/icon_20.png", metric: "legendScore", target: 100, unit: "баллов вклада" }
];

export function getVolunteerAchievements(source: VolunteerAchievementSource = achievementSource): ComputedAchievement[] {
  return achievementDefinitions.map((achievement) => {
    const current = source[achievement.metric];
    const progress = Math.min(100, Math.round((current / achievement.target) * 100));
    const unlocked = current >= achievement.target;
    const remaining = Math.max(0, achievement.target - current);
    return {
      ...achievement,
      current,
      progress,
      unlocked,
      remaining,
      humanProgress: `${Math.min(current, achievement.target)} из ${achievement.target} ${achievement.unit}`,
      nextText: unlocked ? "Медаль уже получена" : `Осталось ${remaining} ${achievement.unit}`
    };
  });
}

export function getNextAchievement(achievements: ComputedAchievement[]) {
  return [...achievements]
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => b.progress - a.progress)[0] ?? achievements[0];
}

export function achievementSummary(achievements: ComputedAchievement[]) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  return {
    unlocked,
    total: achievements.length,
    locked: achievements.length - unlocked,
    progress: Math.round((unlocked / achievements.length) * 100)
  };
}
