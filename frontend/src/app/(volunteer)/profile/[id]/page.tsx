import Image from "next/image";
import { notFound } from "next/navigation";
import { Award, Clock, ListChecks, Send, UserCheck } from "lucide-react";
import { volunteersService } from "@/shared/api";
import { resolveApiFileUrl } from "@/shared/api/config";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { getCategoryLabel, getSkillLabel } from "@/widgets/volunteer-feed/task-dictionaries";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const volunteer = await volunteersService.getPublicVolunteerProfile(id).catch(() => null);
  if (!volunteer) {
    notFound();
  }

  const hours = Number(volunteer.stats.total_hours);
  const completedTasks = volunteer.stats.completed_tasks;
  const progress = Math.min(100, Math.round((hours / Number(volunteer.stats.next_level_hours ?? 60)) * 100));
  const profileBadges = volunteer.achievements
    .filter((achievement) => achievement.is_awarded)
    .slice(0, 4)
    .map((achievement, index) => ({
      icon: `/bages/icon_${Math.min(index + 1, 20)}.png`,
      id: achievement.code,
      title: achievement.title
    }));
  const initials = (volunteer.full_name ?? "Волонтёр")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const avatarUrl = resolveApiFileUrl(volunteer.avatar_url);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_25rem] lg:items-end">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="grid size-24 place-items-center overflow-hidden rounded-[1.6rem] bg-brand text-3xl font-black text-brand-foreground">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials || "В"}
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase text-black/48">{volunteer.stats.profile_level_title}</p>
              <h1 className="mt-2 text-4xl md:text-6xl">{volunteer.full_name ?? "Волонтёр"}</h1>
              <p className="mt-3 text-black/64">{volunteer.position ?? "Волонтёр"} · {volunteer.department ?? "Подразделение не указано"} · {volunteer.city ?? "Город не указан"}</p>
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-background/10 p-5">
            <div className="flex justify-between text-sm text-background/62">
              <span>Прогресс до 60 часов</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-lg bg-background/12">
              <div className="h-full rounded-lg bg-brand" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Часов помощи" value={hours} delta="за всё время" icon={Clock} tone="brand" />
        <StatCard label="Завершено задач" value={completedTasks} delta={`${volunteer.stats.active_applications} активных`} icon={ListChecks} tone="blue" />
        <StatCard label="Откликов" value={volunteer.stats.applications_total} delta="по данным платформы" icon={Send} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>О волонтёре</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-medium leading-7 text-foreground/62">{volunteer.about || "Волонтёр пока не заполнил описание профиля."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>История участия</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <ProfileFact icon={Clock} title={`${hours} ч`} text="начислено" />
                <ProfileFact icon={ListChecks} title={`${completedTasks}`} text="завершено заданий" />
                <ProfileFact icon={UserCheck} title={`${volunteer.stats.active_applications}`} text="активных участий" />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Навыки и интересы</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(volunteer.interests ?? []).map((interest) => <Badge key={interest}>{displayProfileLabel(interest)}</Badge>)}
              {(volunteer.skills ?? []).map((skill) => <Badge key={skill}>{displayProfileLabel(skill)}</Badge>)}
              {(volunteer.pro_bono_skills ?? []).map((skill) => <Badge key={skill}>{displayProfileLabel(skill)}</Badge>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Достижения</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {profileBadges.map((badge) => (
                <div key={badge.id} className="group text-center">
                  <div className="relative mx-auto flex h-24 items-center justify-center transition duration-300 group-hover:-translate-y-1">
                    <span className="absolute bottom-3 h-9 w-16 rounded-full bg-brand/24 blur-xl" />
                    <Image src={badge.icon} alt={badge.title} width={88} height={88} className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_16px_22px_rgba(34,28,8,0.16)]" />
                  </div>
                  <p className="mt-2 text-xs font-black leading-4">{badge.title}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader><CardTitle>Публичные достижения</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {volunteer.achievements.length ? volunteer.achievements.slice(0, 3).map((achievement) => (
            <div key={achievement.code} className="rounded-[1.2rem] bg-surface-raised p-4">
              <Award className="size-5 text-accent-red" />
              <p className="mt-4 font-bold">{achievement.title}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/58">{achievement.description}</p>
            </div>
          )) : (
            <div className="rounded-[1.2rem] bg-surface-raised p-4 md:col-span-3">
              <Award className="size-5 text-accent-red" />
              <p className="mt-4 font-bold">Бейджи пока не получены</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileFact({ icon: Icon, title, text }: { icon: typeof Clock; title: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] bg-surface-raised p-4">
      <Icon className="size-5 text-accent-red" />
      <p className="mt-4 text-2xl font-black">{title}</p>
      <p className="mt-1 text-sm text-foreground/58">{text}</p>
    </div>
  );
}

function displayProfileLabel(value: string) {
  const skill = getSkillLabel(value);
  if (skill !== value) return skill;
  return getCategoryLabel(value);
}
