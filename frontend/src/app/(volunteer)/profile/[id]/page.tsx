import Image from "next/image";
import { notFound } from "next/navigation";
import { Bell, Clock, Flame, ListChecks, Sparkles } from "lucide-react";
import { volunteersService } from "@/shared/api";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { getVolunteerAchievements } from "@/widgets/volunteer-achievements/achievement-data";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const volunteer = await volunteersService.getPublicVolunteerProfile(id).catch(() => null);
  if (!volunteer) {
    notFound();
  }

  const activeTasks: { date: string; foundation: string; hours: number; id: string; title: string }[] = [];
  const history: { date: string; hours: number; status: string; title: string }[] = [];
  const notifications: { text: string; title: string }[] = [];
  const hours = Number(volunteer.stats.total_hours);
  const completedTasks = volunteer.stats.completed_tasks;
  const progress = Math.min(100, Math.round((hours / Number(volunteer.stats.next_level_hours ?? 60)) * 100));
  const achievements = getVolunteerAchievements();
  const profileBadges = volunteer.achievements
    .filter((achievement) => achievement.is_awarded)
    .map((achievement) => achievements.find((item) => item.title === achievement.title))
    .filter((achievement): achievement is NonNullable<typeof achievement> => Boolean(achievement));
  const initials = (volunteer.full_name ?? "Волонтёр")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_25rem] lg:items-end">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="grid size-24 place-items-center rounded-[1.6rem] bg-brand text-3xl font-black text-brand-foreground">{initials || "В"}</div>
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
        <StatCard label="Активная серия" value="5 недель" delta="участие без пауз" icon={Flame} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Активные задачи</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="rounded-[1.25rem] bg-surface-raised p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">{task.title}</p>
                      <p className="mt-1 text-sm text-foreground/58">{task.foundation} · {task.date}</p>
                    </div>
                    <Badge tone="brand">{task.hours} часов</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>История участия</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {history.map((item) => (
                <div key={item.title} className="grid gap-2 rounded-[1.2rem] bg-surface-raised p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <span className="font-bold">{item.title}</span>
                  <span className="text-sm text-foreground/58">{item.date}</span>
                  <Badge tone="green">{item.hours} ч · {item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Навыки и интересы</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(volunteer.interests ?? []).map((interest) => <Badge key={interest}>{interest}</Badge>)}
              {(volunteer.skills ?? []).map((skill) => <Badge key={skill}>{skill}</Badge>)}
              {(volunteer.pro_bono_skills ?? []).map((skill) => <Badge key={skill}>{skill}</Badge>)}
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
          <Card>
            <CardHeader><CardTitle>Уведомления</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((item) => (
                <div key={item.title} className="rounded-[1.1rem] bg-surface-raised p-3">
                  <p className="flex items-center gap-2 text-sm font-black"><Bell className="size-4" />{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-foreground/58">{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader><CardTitle>Лента вклада</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {["Откликнулась на спортивный день", "Получила подтверждение часов", "Помогла фонду с медиакитом"].map((item) => (
            <div key={item} className="rounded-[1.2rem] bg-surface-raised p-4">
              <Sparkles className="size-5 text-accent-red" />
              <p className="mt-4 font-bold">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
