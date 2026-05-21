"use client";

import type { ReactNode } from "react";
import { Award, Bell, Clock, History, Inbox, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { applicationApi, taskApi, volunteerApi } from "@/shared/api/services";
import type { ApiAchievement, ApiApplication, ApiVolunteerHistoryItem } from "@/shared/api/types";
import { useAuthStore } from "@/shared/auth/auth-store";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

export function ApplicationsPage() {
  const { applications, awardedHours, isLoading } = useVolunteerSectionData();
  const active = applications.filter((item) => ["applied", "accepted", "completion_confirmed"].includes(item.status));

  return (
    <VolunteerSectionShell
      icon="Отклики"
      title="Мои отклики"
      description="Каждый отклик показывает, на каком шаге он находится и что нужно сделать дальше."
      metrics={[
        { icon: Inbox, value: `${active.length}`, label: "активных отклика" },
        { icon: Clock, value: `${awardedHours}`, label: "часов начислено" },
        { icon: Award, value: `${applications.filter((item) => item.status === "accepted").length}`, label: "принято фондом" },
        { icon: Bell, value: `${applications.filter((item) => item.status === "applied").length}`, label: "ожидают ответа" }
      ]}
    >
      <EditorialList items={applications.map(applicationToListItem)} />
      {!applications.length ? <EmptyState isLoading={isLoading} /> : null}
    </VolunteerSectionShell>
  );
}

export function HistoryPage() {
  const { history, awardedHours, isLoading } = useVolunteerSectionData();

  return (
    <VolunteerSectionShell
      icon="История"
      title="История помощи"
      description="Завершённые участия, подтверждения фондов и вклад по категориям."
      metrics={[
        { icon: History, value: `${history.length}`, label: "событий" },
        { icon: Clock, value: `${awardedHours}`, label: "часов подтверждено" },
        { icon: Award, value: `${new Set(history.map((item) => item.task?.category).filter(Boolean)).size}`, label: "категории вклада" },
        { icon: UserRound, value: "100%", label: "данные из API" }
      ]}
    >
      <EditorialList items={history.map(historyToListItem)} />
      {!history.length ? <EmptyState isLoading={isLoading} /> : null}
    </VolunteerSectionShell>
  );
}

export function HoursPage() {
  const { applications, awardedHours } = useVolunteerSectionData();
  const waitingFund = applications.filter((item) => item.status === "accepted").length;
  const waitingAdmin = applications.filter((item) => item.status === "completion_confirmed").length;

  return (
    <VolunteerSectionShell
      icon="Часы"
      title="Волонтёрские часы"
      description="Часы не начисляются автоматически: фонд подтверждает участие, администратор проверяет и добавляет их в профиль."
      metrics={[
        { icon: Clock, value: `${awardedHours}`, label: "начислено" },
        { icon: Inbox, value: `${waitingFund}`, label: "ожидает фонда" },
        { icon: Bell, value: `${waitingAdmin}`, label: "ожидает админа" },
        { icon: Award, value: "60", label: "цель квартала" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {["Фонд подтвердил участие", "Администратор проверяет", "Часы начислены"].map((step, index) => (
          <div key={step} className="rounded-[1.35rem] bg-white/68 p-5">
            <StatusPill tone={index === 2 ? "green" : "gold"}>Шаг {index + 1}</StatusPill>
            <h3 className="mt-4 text-xl font-black">{step}</h3>
            <p className="mt-2 text-sm leading-6 text-black/58">{index === 0 ? "Координатор фиксирует факт участия." : index === 1 ? "Проверяются даты, часы и статус задания." : "Вклад попадает в профиль и отчёты."}</p>
          </div>
        ))}
      </div>
    </VolunteerSectionShell>
  );
}

export function AchievementsPage() {
  const { achievements, awardedHours, isLoading } = useVolunteerSectionData();
  const awarded = achievements.filter((achievement) => achievement.is_awarded);

  return (
    <VolunteerSectionShell
      icon="Достижения"
      title="Достижения"
      description="Статус, прогресс и значимые milestones подтягиваются из backend."
      metrics={[
        { icon: Award, value: `${awarded.length}`, label: "получено" },
        { icon: Clock, value: `${awardedHours}`, label: "часов учтено" },
        { icon: UserRound, value: `${achievements.length}`, label: "целей" },
        { icon: Bell, value: `${achievements.filter((achievement) => !achievement.is_awarded).length}`, label: "в прогрессе" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {achievements.map((achievement) => (
          <div key={achievement.code} className="gold-panel rounded-[1.35rem] p-5">
            <Award className="size-8" />
            <h3 className="mt-5 text-xl font-black">{achievement.title}</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">{achievement.description}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-black/42">
              {achievement.progress_current}/{achievement.progress_target}
            </p>
          </div>
        ))}
      </div>
      {!achievements.length ? <EmptyState isLoading={isLoading} /> : null}
    </VolunteerSectionShell>
  );
}

export function NotificationsPage() {
  const { applications, isLoading } = useVolunteerSectionData();
  const notifications = applications.filter((item) => item.status !== "canceled");

  return (
    <VolunteerSectionShell
      icon="Уведомления"
      title="Уведомления"
      description="Только полезные статусы: решения фондов, подтверждения часов и важные дедлайны."
      metrics={[
        { icon: Bell, value: `${notifications.length}`, label: "новых" },
        { icon: Inbox, value: `${applications.filter((item) => item.status === "applied").length}`, label: "по откликам" },
        { icon: Clock, value: `${applications.filter((item) => item.status === "completion_confirmed").length}`, label: "по часам" },
        { icon: Award, value: "0", label: "без спама" }
      ]}
    >
      <EditorialList items={notifications.map(applicationToListItem)} />
      {!notifications.length ? <EmptyState isLoading={isLoading} /> : null}
    </VolunteerSectionShell>
  );
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { achievements, applications, tasks } = useVolunteerSectionData();
  const skills = Array.from(new Set(tasks.flatMap((task) => task.required_skills ?? []))).slice(0, 8);
  const initials = (user?.full_name ?? user?.email ?? "В").slice(0, 2).toUpperCase();

  return (
    <VolunteerSectionShell
      icon="Профиль"
      title="Профиль волонтёра"
      description="Данные сотрудника подтянуты из backend-профиля."
      metrics={[
        { icon: UserRound, value: user?.city ?? "Город", label: "город" },
        { icon: Clock, value: `${applications.filter((item) => item.status === "hours_awarded").length}`, label: "начислений" },
        { icon: Award, value: `${achievements.filter((achievement) => achievement.is_awarded).length}`, label: "достижений" },
        { icon: Inbox, value: `${applications.length}`, label: "откликов" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
          <div className="grid size-20 place-items-center rounded-3xl bg-brand text-2xl font-black text-black">{initials}</div>
          <h3 className="mt-5 text-2xl font-black text-black">{user?.full_name ?? user?.email ?? "Волонтёр"}</h3>
          <p className="mt-1 text-black/58">{[user?.position, user?.department].filter(Boolean).join(", ") || user?.email}</p>
        </div>
        <div className="rounded-[1.35rem] bg-white/68 p-5">
          <h3 className="text-xl font-black">Навыки и интересы</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => <StatusPill key={skill}>{skill}</StatusPill>)}
            {!skills.length ? <StatusPill tone="muted">Пока нет данных</StatusPill> : null}
          </div>
        </div>
      </div>
    </VolunteerSectionShell>
  );
}

function useVolunteerSectionData() {
  const applicationsQuery = useQuery({ queryKey: ["applications", "mine", "sections"], queryFn: () => applicationApi.listMine() });
  const historyQuery = useQuery({ queryKey: ["volunteers", "history", "sections"], queryFn: () => volunteerApi.history() });
  const achievementsQuery = useQuery({ queryKey: ["volunteers", "achievements", "sections"], queryFn: () => volunteerApi.achievements() });
  const tasksQuery = useQuery({ queryKey: ["tasks", "feed", "sections"], queryFn: () => taskApi.listFeed() });

  const history = historyQuery.data ?? [];

  return {
    applications: applicationsQuery.data ?? [],
    history,
    achievements: achievementsQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    awardedHours: history.reduce((sum, item) => sum + Number(item.hours ?? 0), 0),
    isLoading: applicationsQuery.isLoading || historyQuery.isLoading || achievementsQuery.isLoading || tasksQuery.isLoading
  };
}

function applicationToListItem(application: ApiApplication) {
  return {
    title: application.task?.title ?? `Заявка ${application.id.slice(0, 8)}`,
    meta: application.status,
    text: application.fund_comment ?? application.volunteer_comment ?? "Статус отклика получен из backend.",
    status: application.status
  };
}

function historyToListItem(item: ApiVolunteerHistoryItem) {
  return {
    title: item.title,
    meta: `${formatDate(item.occurred_at)} / ${Number(item.hours ?? 0)} часов`,
    text: item.description ?? item.task?.title ?? "Событие истории получено из backend.",
    status: item.status ?? item.event_type
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(value));
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return <p className="mt-4 rounded-[1.1rem] bg-white/60 p-4 text-sm font-bold text-black/54">{isLoading ? "Загружаем данные..." : "Данных пока нет."}</p>;
}

function VolunteerSectionShell({
  icon,
  title,
  description,
  metrics,
  children
}: {
  icon: string;
  title: string;
  description: string;
  metrics: Parameters<typeof MetricStrip>[0]["items"];
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow={icon} title={title} description={description} tone="light" />
      <MetricStrip items={metrics} />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}
