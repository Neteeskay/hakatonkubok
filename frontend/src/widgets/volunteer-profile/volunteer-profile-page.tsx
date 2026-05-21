"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Mail,
  MapPin,
  Medal,
  Phone,
  Star,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { resolveApiFileUrl } from "@/shared/api/config";
import { getApiErrorMessage } from "@/shared/api/errors";
import { volunteersService } from "@/shared/api/services/volunteers";
import type {
  UserResponse,
  VolunteerAchievementStatsResponse,
  VolunteerHoursDynamicsItemResponse,
  VolunteerHoursSummaryResponse,
  VolunteerHistoryItemResponse,
  VolunteerProfileResponse
} from "@/shared/api/types";
import {
  emptyProfileDraft,
  ProfileEditDrawer,
  type ProfileDraft,
  type ProfileEditFocus,
  type ProfileSkillsSnapshot
} from "@/widgets/volunteer-profile/profile-edit-drawer";
import { ProfileCard, ProfileSectionTitle, RoundIcon, SoftBadge } from "@/widgets/volunteer-profile/profile-ui";
import { SkillChip } from "@/widgets/volunteer-profile/ui/skill-chip";
import { getCategoryLabel, getSkillLabel, getTaskVisual } from "@/widgets/volunteer-feed/task-dictionaries";
import { mapAchievementResponseToComputed } from "@/widgets/volunteer-achievements/achievement-api-mappers";
import type { ComputedAchievement } from "@/widgets/volunteer-achievements/achievement-data";
import { ProfileBadgesPreview } from "@/widgets/volunteer-achievements/ui/profile-badges-preview";

const emptySkillsSnapshot: ProfileSkillsSnapshot = {
  interests: [],
  proBono: [],
  skills: []
};

type ProfileUserResponse = UserResponse | VolunteerProfileResponse;

export function VolunteerProfilePage() {
  const [editing, setEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<ProfileEditFocus>("basic");
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [skillsSnapshot, setSkillsSnapshot] = useState<ProfileSkillsSnapshot>(emptySkillsSnapshot);
  const [user, setUser] = useState<ProfileUserResponse | null>(null);
  const [hoursSummary, setHoursSummary] = useState<VolunteerHoursSummaryResponse | null>(null);
  const [hoursDynamics, setHoursDynamics] = useState<VolunteerHoursDynamicsItemResponse[]>([]);
  const [history, setHistory] = useState<VolunteerHistoryItemResponse[]>([]);
  const [achievementStats, setAchievementStats] = useState<VolunteerAchievementStatsResponse | null>(null);
  const [achievements, setAchievements] = useState<ComputedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const profileStats = useMemo(() => buildProfileStats(hoursSummary, history, achievementStats), [achievementStats, history, hoursSummary]);
  const hoursByMonth = useMemo(() => mapHoursDynamics(hoursDynamics), [hoursDynamics]);
  const profileRows = useMemo(() => mapHistoryRows(history), [history]);
  const profileTimeline = useMemo(() => mapProfileTimeline(history, achievements), [achievements, history]);
  const totalHours = Math.round(Number(hoursSummary?.total_hours ?? achievementStats?.total_hours ?? 0));
  const level = Math.max(1, Math.floor(totalHours / 25) + 1);
  const displayName = profileDraft.name || "Профиль волонтёра";
  const memberSince = user?.created_at ? `Волонтёр с ${formatDate(user.created_at, { month: "long", year: "numeric" })}` : "Волонтёр";
  const initials = getInitials(displayName);
  const avatarUrl = resolveApiFileUrl(profileDraft.avatarUrl);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const currentUser = await volunteersService.getMyVolunteerProfile();
        if (!active) return;

        const nextDraft = mapUserToProfileDraft(currentUser);
        setUser(currentUser);
        setProfileDraft(nextDraft);
        setSkillsSnapshot(toSkillsSnapshot(nextDraft));

        const [summaryResult, dynamicsResult, historyResult, achievementsResult] = await Promise.allSettled([
          volunteersService.getMyVolunteerHoursSummary(),
          volunteersService.getMyVolunteerHoursDynamics(),
          volunteersService.getMyVolunteerHistory({ limit: 5 }),
          volunteersService.getMyVolunteerAchievementsOverview()
        ]);

        if (!active) return;

        setHoursSummary(summaryResult.status === "fulfilled" ? summaryResult.value : null);
        setHoursDynamics(dynamicsResult.status === "fulfilled" ? dynamicsResult.value : []);
        setHistory(historyResult.status === "fulfilled" ? historyResult.value : []);
        if (achievementsResult.status === "fulfilled") {
          setAchievementStats(achievementsResult.value.stats);
          setAchievements(achievementsResult.value.achievements.map(mapAchievementResponseToComputed));
        } else {
          setAchievementStats(null);
          setAchievements([]);
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function openEditor(focus: ProfileEditFocus = "basic") {
    setEditFocus(focus);
    setEditing(true);
    setSuccess(null);
  }

  async function handleSaveProfile(draft: ProfileDraft) {
    const response = await volunteersService.updateMyVolunteerProfile({
      about: draft.about.trim() || null,
      city: draft.city.trim() || null,
      full_name: draft.name.trim() || null,
      interests: draft.interests,
      phone: draft.phone.trim() || null,
      pro_bono_skills: draft.proBono,
      skills: draft.skills
    });
    const nextDraft = mapUserToProfileDraft({ ...response, avatar_url: response.avatar_url ?? draft.avatarUrl }, draft);

    setUser(response);
    setProfileDraft(nextDraft);
    setSkillsSnapshot(toSkillsSnapshot(nextDraft));
    setSuccess("Профиль сохранён");
  }

  async function handleAvatarUpload(file: File) {
    const response = await volunteersService.uploadMyAvatar(file);
    return response.avatar_url;
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center md:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[60%] bg-gradient-to-r from-white via-white/60 to-transparent md:block" />
        <div className="relative z-10 grid gap-6 md:grid-cols-[150px_1fr] md:items-center">
          <div className="relative size-36 overflow-hidden rounded-full bg-brand/20 shadow-[0_18px_44px_rgba(34,28,8,0.12)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_32%,#fff_0_9%,transparent_10%),linear-gradient(145deg,#FFE300,#FFE300)]" />
                <span className="absolute inset-0 grid place-items-center text-5xl font-black">{initials}</span>
              </>
            )}
            <button onClick={() => openEditor()} className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(34,28,8,0.18)]" aria-label="Редактировать фото">
              <Edit3 className="size-4" />
            </button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black leading-none md:text-5xl">{displayName}</h1>
              <SoftBadge tone="gold"><Star className="mr-1 size-3.5" />Уровень {level}</SoftBadge>
            </div>
            <p className="mt-3 text-sm font-bold text-black/54">{memberSince}</p>
            <div className="mt-5 grid gap-2 text-sm font-bold text-black/62">
              <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{profileDraft.city || "Город не указан"}</span>
              <span className="inline-flex items-center gap-2"><Mail className="size-4" />{profileDraft.email || "Email не указан"}</span>
              <span className="inline-flex items-center gap-2"><Phone className="size-4" />{profileDraft.phone || "Телефон не указан"}</span>
            </div>
            {loading ? <p className="mt-4 text-sm font-bold text-black/44">Загружаем профиль...</p> : null}
            {error ? <p className="mt-4 rounded-xl bg-[#fff1f1] p-3 text-sm font-bold text-[#c83c3c]">{error}</p> : null}
            {success ? <p className="mt-4 rounded-xl bg-[#e8f8e8] p-3 text-sm font-bold text-[#247a31]">{success}</p> : null}
            <button onClick={() => openEditor()} className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.09),0_12px_28px_rgba(34,28,8,0.06)] transition hover:bg-brand/12">
              Редактировать профиль
              <Edit3 className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {profileStats.map((stat) => (
          <ProfileCard key={stat.label}>
            <RoundIcon icon={stat.icon} />
            <div className="mt-4 flex items-end gap-2">
              <p className="text-3xl font-black leading-none">{stat.value}</p>
              <p className="pb-1 text-sm font-bold leading-4 text-black/62">{stat.label}</p>
            </div>
            <p className="mt-5 text-xs font-bold text-black/54">{stat.helper}</p>
            <div className="mt-3 h-2 rounded-full bg-[#efeee8]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${stat.progress}%` }} />
            </div>
          </ProfileCard>
        ))}
      </div>

      <ProfileCard>
        <ProfileSectionTitle title="Мои бейджи" action="Все бейджи →" actionHref="/volunteer/achievements" />
        <ProfileBadgesPreview achievements={achievements} />
      </ProfileCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <ProfileCard>
          <ProfileSectionTitle title="Мои часы" action="Открыть часы →" actionHref="/volunteer/hours" />
          <p className="text-3xl font-black">{totalHours} часов</p>
          <p className="mt-1 text-sm text-black/50">Общее количество</p>
          <div className="mt-6 flex h-48 items-end gap-5">
            {hoursByMonth.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${Math.max(4, Math.min(180, item.value * 5))}px` }} />
                <p className="text-center text-xs font-bold text-black/52">{item.month}</p>
              </div>
            ))}
          </div>
        </ProfileCard>

        <div className="space-y-5">
          <ProfileCard>
            <EditableSectionTitle title="Мои навыки" onEdit={() => openEditor("skills")} />
            <div className="flex flex-wrap gap-2">
              {skillsSnapshot.interests.map((item) => <SkillChip key={item} label={item} tone="brand" />)}
            </div>
          </ProfileCard>
          <ProfileCard>
            <EditableSectionTitle title="Проф. навыки" onEdit={() => openEditor("skills")} />
            <div className="flex flex-wrap gap-2">
              {skillsSnapshot.skills.map((item) => <SkillChip key={item} label={item} tone="violet" />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {skillsSnapshot.proBono.map((item) => <SkillChip key={item} label={item} tone="brand" />)}
            </div>
          </ProfileCard>
        </div>
      </div>

      <ProfileCard>
        <div className="mb-5 flex flex-wrap gap-6 border-b border-black/8">
          {[
            { label: "История откликов", href: "/volunteer/applications" },
            { label: "Мои участия", href: "/volunteer/history" },
            { label: "Начисленные часы", href: "/volunteer/hours" }
          ].map((tab, index) => (
            <Link key={tab.href} href={tab.href} className={`pb-3 text-sm font-black transition hover:text-black ${index === 0 ? "border-b-4 border-brand text-black" : "text-black/48"}`}>
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
            <thead className="text-xs font-black uppercase tracking-[0.12em] text-black/36">
              <tr><th>Задание</th><th>Статус</th><th>Период</th><th>Часы</th><th /></tr>
            </thead>
            <tbody>
              {profileRows.map((row) => (
                <tr key={`${row.task.id}-${row.period}`} className="group">
                  <td className="rounded-l-2xl bg-[#fffdf7] p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-20 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${getTaskVisual(row.task.id).image}')` }} />
                      <div>
                        <p className="font-black">{row.task.title}</p>
                        <p className="mt-1 text-xs text-black/48">{row.task.foundation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="bg-[#fffdf7] p-3"><SoftBadge tone={row.tone}>{row.status}</SoftBadge></td>
                  <td className="whitespace-pre-line bg-[#fffdf7] p-3 text-sm font-bold text-black/58">{row.period}</td>
                  <td className="bg-[#fffdf7] p-3 text-sm font-black">{row.hours}</td>
                  <td className="rounded-r-2xl bg-[#fffdf7] p-3 text-right text-black/38 transition group-hover:text-black">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/volunteer/applications" className="mx-auto mt-3 flex h-11 w-full max-w-[560px] items-center justify-center rounded-full bg-[#fbfaf4] text-sm font-black text-black/62 transition hover:bg-brand/12">
          Показать ещё
        </Link>
      </ProfileCard>

      <ProfileCard>
        <ProfileSectionTitle title="Активность" />
        <div className="space-y-4">
          {profileTimeline.map((item) => (
            <div key={`${item.title}-${item.time}`} className="flex gap-4">
              <RoundIcon icon={item.icon} />
              <div className="min-w-0 flex-1 rounded-2xl bg-[#fffdf7] p-4">
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm text-black/54">{item.text}</p>
              </div>
              <p className="w-28 pt-4 text-right text-xs font-bold text-black/42">{item.time}</p>
            </div>
          ))}
        </div>
      </ProfileCard>

      <ProfileEditDrawer
        open={editing}
        onClose={() => setEditing(false)}
        initialFocus={editFocus}
        profileDraft={profileDraft}
        skillsSnapshot={skillsSnapshot}
        onAvatarUpload={handleAvatarUpload}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

function EditableSectionTitle({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-xl font-black">{title}</h2>
      <button onClick={onEdit} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#fbfaf4] px-3 text-sm font-black text-black/58 transition hover:bg-brand/12 hover:text-black">
        Редактировать
        <Edit3 className="size-4" />
      </button>
    </div>
  );
}

function mapUserToProfileDraft(user: ProfileUserResponse, previous?: ProfileDraft): ProfileDraft {
  const username = "username" in user ? user.username : null;

  return {
    about: user.about ?? previous?.about ?? "",
    avatarUrl: user.avatar_url ?? previous?.avatarUrl ?? null,
    city: user.city ?? "",
    email: user.email,
    interests: mapProfileLabels(user.interests),
    name: user.full_name ?? username ?? user.email,
    phone: user.phone ?? "",
    proBono: mapProfileLabels(user.pro_bono_skills ?? previous?.proBono),
    skills: mapProfileLabels(user.skills)
  };
}

function toSkillsSnapshot(draft: ProfileDraft): ProfileSkillsSnapshot {
  return {
    interests: draft.interests,
    proBono: draft.proBono,
    skills: draft.skills
  };
}

function mapProfileLabels(values: string[] | null | undefined) {
  return Array.from(new Set((values ?? []).map((value) => {
    const skill = getSkillLabel(value);
    if (skill !== value) return skill;
    return getCategoryLabel(value);
  }).filter(Boolean)));
}

function buildProfileStats(
  summary: VolunteerHoursSummaryResponse | null,
  history: VolunteerHistoryItemResponse[],
  stats: VolunteerAchievementStatsResponse | null
) {
  const totalHours = Math.round(Number(summary?.total_hours ?? stats?.total_hours ?? 0));
  const completedTasks = summary?.tasks_count ?? stats?.completed_tasks_count ?? history.filter((item) => item.status === "completion_confirmed" || item.status === "hours_awarded").length;
  const funds = new Set(history.map((item) => item.task?.fund_name).filter(Boolean)).size;
  const activeDays = stats?.daily_activity_streak_days ?? new Set(history.map((item) => item.occurred_at.slice(0, 10))).size;

  return [
    { icon: Clock, value: String(totalHours), label: "часов помощи", helper: `Записей: ${summary?.entries_count ?? 0}`, progress: Math.min(100, totalHours) },
    { icon: CalendarCheck, value: String(completedTasks), label: "заданий выполнено", helper: "По данным платформы", progress: Math.min(100, completedTasks * 8) },
    { icon: UsersRound, value: String(funds), label: "фондов поддержано", helper: "Из истории участия", progress: Math.min(100, funds * 12) },
    { icon: Flame, value: String(activeDays), label: "дней активности", helper: "Серия активных дней", progress: Math.min(100, activeDays * 10) }
  ] satisfies { icon: LucideIcon; value: string; label: string; helper: string; progress: number }[];
}

function mapHoursDynamics(items: VolunteerHoursDynamicsItemResponse[]) {
  return items.map((item) => ({
    month: formatDate(item.period, { month: "short" }).replace(".", ""),
    value: Math.round(Number(item.hours ?? 0))
  }));
}

function mapHistoryRows(items: VolunteerHistoryItemResponse[]) {
  return items.map((item) => {
    const taskId = item.task?.id ?? item.application_id ?? item.occurred_at;

    return {
      hours: item.hours ? `${Math.round(Number(item.hours))} ч` : "-",
      period: formatDate(item.occurred_at, { day: "numeric", month: "long", year: "numeric" }),
      status: historyStatusLabel(item.status),
      task: {
        foundation: item.task?.fund_name ?? "Фонд",
        id: taskId,
        title: item.task?.title ?? item.title
      },
      tone: historyTone(item.status)
    };
  });
}

function mapProfileTimeline(history: VolunteerHistoryItemResponse[], achievements: ComputedAchievement[]) {
  const historyItems = history.slice(0, 3).map((item) => ({
    icon: item.status === "hours_awarded" ? Medal : CheckCircle2,
    text: item.description ?? item.title,
    time: formatDate(item.occurred_at, { day: "numeric", month: "long" }),
    title: item.title
  }));

  if (historyItems.length) {
    return historyItems;
  }

  return achievements
    .filter((achievement) => achievement.unlocked)
    .slice(0, 3)
    .map((achievement) => ({
      icon: Award,
      text: achievement.description,
      time: achievement.earnedAt ?? "",
      title: achievement.title
    }));
}

function historyStatusLabel(status: VolunteerHistoryItemResponse["status"]) {
  if (status === "hours_awarded") return "Часы начислены";
  if (status === "completion_confirmed") return "Часы на проверке";
  if (status === "accepted") return "Подтверждено фондом";
  if (status === "rejected" || status === "canceled") return "Отклонено";
  return "На рассмотрении";
}

function historyTone(status: VolunteerHistoryItemResponse["status"]): "green" | "violet" | "red" {
  if (status === "hours_awarded") return "green";
  if (status === "rejected" || status === "canceled") return "red";
  return "violet";
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "В";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase();
}
