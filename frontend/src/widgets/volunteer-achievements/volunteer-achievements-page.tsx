"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, Clock3, LockKeyhole, Sparkles, Star } from "lucide-react";
import { getApiErrorMessage } from "@/shared/api/errors";
import { volunteersService } from "@/shared/api/services/volunteers";
import type { ComputedAchievement } from "@/widgets/volunteer-achievements/achievement-data";
import {
  emptyAchievement,
  mapAchievementResponseToComputed,
  mapAchievementsOverviewToComputed
} from "@/widgets/volunteer-achievements/achievement-api-mappers";
import { AchievementCard } from "@/widgets/volunteer-achievements/ui/achievement-card";

export function VolunteerAchievementsPage() {
  const [achievements, setAchievements] = useState<ComputedAchievement[]>([]);
  const [nextAchievement, setNextAchievement] = useState<ComputedAchievement | null>(null);
  const [confirmedHours, setConfirmedHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summary = useMemo(() => achievementSummary(achievements), [achievements]);
  const next = nextAchievement ?? getNextAchievement(achievements) ?? emptyAchievement;
  const unlocked = achievements.filter((achievement) => achievement.unlocked);
  const locked = achievements.filter((achievement) => !achievement.unlocked);
  const lastUnlocked = unlocked.at(-1) ?? achievements[0] ?? emptyAchievement;
  const biggestGoal = achievements.find((achievement) => achievement.id === "prosto-legend") ?? achievements.at(-1) ?? emptyAchievement;

  useEffect(() => {
    let active = true;

    async function loadAchievements() {
      setLoading(true);
      setError(null);

      try {
        const overview = await volunteersService.getMyVolunteerAchievementsOverview();
        if (!active) return;

        const mapped = mapAchievementsOverviewToComputed(overview);
        setAchievements(mapped.achievements);
        setNextAchievement(mapped.nextAchievement);
        setConfirmedHours(Number(mapped.stats.total_hours));
      } catch (overviewError) {
        try {
          const response = await volunteersService.getMyVolunteerAchievements();
          if (!active) return;

          setAchievements(response.map(mapAchievementResponseToComputed));
          setNextAchievement(null);
          setConfirmedHours(null);
        } catch (listError) {
          if (active) {
            setError(getApiErrorMessage(listError instanceof Error ? listError : overviewError));
            setAchievements([]);
            setNextAchievement(null);
            setConfirmedHours(null);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAchievements();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-6 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-[50%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-70 lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[64%] bg-gradient-to-r from-white via-white/82 to-transparent lg:block" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/16 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black/46">
              <Sparkles className="size-4" />
              Достижения
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] md:text-5xl">Ваш путь волонтёра</h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-black/58">
              Медали показывают не просто активность, а ваш вклад: часы, подтверждённые участия, pro bono задачи, категории помощи и надёжность.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <HeroMetric icon={Award} value={loading ? "..." : `${summary.unlocked}/${summary.total}`} label="медалей открыто" />
              <HeroMetric icon={LockKeyhole} value={loading ? "..." : `${summary.locked}`} label="осталось открыть" />
              <HeroMetric icon={Clock3} value={loading ? "..." : `${Math.round(confirmedHours ?? 0)} ч`} label="подтверждено" />
            </div>
            {error ? <p className="mt-4 rounded-xl bg-[#fff1f1] p-3 text-sm font-bold text-[#c83c3c]">{error}</p> : null}
          </div>
          <div className="rounded-[1.55rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
            <div className="flex items-start gap-4">
              <div className="relative grid size-24 shrink-0 place-items-center rounded-[1.5rem] bg-white shadow-[0_18px_42px_rgba(34,28,8,0.08)]">
                <Image src={next.icon} alt={next.title} width={84} height={84} className="h-20 w-20 object-contain drop-shadow-[0_12px_22px_rgba(34,28,8,0.15)]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">Следующая медаль</p>
                <h2 className="mt-2 text-2xl font-black leading-tight">{next.title}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-black/50">{next.nextText}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between gap-4 text-sm font-black">
                <span>{next.humanProgress}</span>
                <span>{next.progress}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/8">
                <div className="h-full rounded-full bg-brand" style={{ width: `${next.progress}%` }} />
              </div>
            </div>
            <Link href="#all-achievements" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-black">
              Смотреть медали
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ProgressPanel title="Ближе всего" achievement={next} />
        <ProgressPanel title="Последняя полученная" achievement={lastUnlocked} success />
        <ProgressPanel title="Большая цель" achievement={biggestGoal} />
      </section>

      <section id="all-achievements" className="rounded-[1.8rem] bg-white p-5 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black">Все медали</h2>
            <p className="mt-2 text-sm font-bold text-black/48">Полученные медали яркие, закрытые показывают понятный следующий шаг.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e8f8eb] px-3 py-1.5 text-xs font-black text-[#247a31]">Получено {unlocked.length}</span>
            <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/52">В процессе {locked.length}</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ icon: Icon, value, label }: { icon: typeof Award; value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#fffdf7] p-4">
      <Icon className="size-6 text-brand" />
      <p className="mt-3 text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-xs font-black text-black/46">{label}</p>
    </div>
  );
}

function ProgressPanel({ title, achievement, success = false }: { title: string; achievement: ComputedAchievement; success?: boolean }) {
  return (
    <article className="rounded-[1.45rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <div className="flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand">
          {success ? <CheckCircle2 className="size-5" /> : <Star className="size-5" />}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{title}</p>
          <h3 className="mt-2 text-xl font-black leading-tight">{achievement.title}</h3>
          <p className="mt-1 text-sm font-bold text-black/48">{achievement.humanProgress}</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/8">
        <div className="h-full rounded-full bg-brand" style={{ width: `${achievement.progress}%` }} />
      </div>
    </article>
  );
}

function getNextAchievement(achievements: ComputedAchievement[]) {
  return [...achievements]
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => b.progress - a.progress)[0] ?? achievements[0];
}

function achievementSummary(achievements: ComputedAchievement[]) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const total = achievements.length;

  return {
    locked: total - unlocked,
    progress: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    total,
    unlocked
  };
}
