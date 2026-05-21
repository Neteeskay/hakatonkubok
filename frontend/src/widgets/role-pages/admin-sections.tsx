"use client";

import type { ReactNode } from "react";
import { Building2, Clock, Download, ShieldCheck, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import type { ApiAdminApplication, ApiAdminCompletion, ApiAdminFund, ApiAdminTask } from "@/shared/api/types";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

export function AdminFoundationsPage() {
  return <AdminShell title="Фонды" description="Единый реестр фондов с модерационным статусом, куратором и показателями доверия."><FoundationList /></AdminShell>;
}

export function AdminFoundationModerationPage() {
  const { data: funds = [], isLoading } = useQuery({ queryKey: ["admin", "funds", "pending_review"], queryFn: () => adminApi.funds("pending_review") });

  return (
    <AdminShell title="Модерация фондов" description="Approve, reject или revision с обязательным комментарием для фонда.">
      <EditorialList items={funds.map(fundToListItem)} />
      {!funds.length ? <EmptyState isLoading={isLoading} /> : null}
    </AdminShell>
  );
}

export function AdminTasksPage() {
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["admin", "tasks"], queryFn: () => adminApi.tasks() });

  return (
    <AdminShell title="Задания" description="Все активности программы: опубликованные, закрытые и ожидающие проверки.">
      <EditorialList items={tasks.map(taskToListItem)} />
      {!tasks.length ? <EmptyState isLoading={isLoading} /> : null}
    </AdminShell>
  );
}

export function AdminTaskModerationPage() {
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["admin", "tasks", "pending_review"], queryFn: () => adminApi.tasks("pending_review") });

  return (
    <AdminShell title="Модерация заданий" description="Проверка корректности описания, формата участия, материалов и отсутствия fundraising.">
      <EditorialList items={tasks.map(taskToListItem)} />
      {!tasks.length ? <EmptyState isLoading={isLoading} /> : null}
    </AdminShell>
  );
}

export function AdminVolunteersPage() {
  const { data: applications = [], isLoading } = useQuery({ queryKey: ["admin", "applications"], queryFn: () => adminApi.applications() });

  return (
    <AdminShell title="Волонтёры" description="Участники программы, их часы, активность и участие в категориях помощи.">
      <EditorialList items={applications.map(applicationToListItem)} />
      {!applications.length ? <EmptyState isLoading={isLoading} /> : null}
    </AdminShell>
  );
}

export function AdminHoursPage() {
  const { data: completions = [], isLoading } = useQuery({ queryKey: ["admin", "completions", "waiting-hours"], queryFn: () => adminApi.waitingHours() });

  return (
    <AdminShell title="Начисление часов" description="Финальная стадия цепочки: фонд подтвердил факт участия, администратор проверяет и начисляет часы.">
      <EditorialList items={completions.map(completionToListItem)} />
      {!completions.length ? <EmptyState isLoading={isLoading} /> : null}
    </AdminShell>
  );
}

export function AdminAnalyticsPage() {
  const { data: dashboard } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => adminApi.dashboard() });
  const impactSeries = [
    { month: "Фонды", hours: dashboard?.funds_total ?? 0, tasks: dashboard?.funds_pending_review ?? 0 },
    { month: "Задания", hours: dashboard?.tasks_total ?? 0, tasks: dashboard?.tasks_pending_review ?? 0 },
    { month: "Отклики", hours: dashboard?.applications_total ?? 0, tasks: dashboard?.tasks_published ?? 0 },
    { month: "Часы", hours: Number(dashboard?.awarded_hours_total ?? 0), tasks: dashboard?.completions_waiting_hours ?? 0 }
  ];

  return (
    <AdminShell title="Аналитика" description="Сводка по волонтёрам, часам, категориям, фондам и завершённым активностям.">
      <div className="grid gap-4 md:grid-cols-4">
        {impactSeries.map((item) => (
          <div key={item.month} className="rounded-[1.35rem] bg-white/70 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{item.month}</p>
            <p className="mt-3 text-3xl font-black">{item.hours}</p>
            <p className="mt-1 text-sm text-black/54">основной показатель / {item.tasks} в работе</p>
            <div className="mt-4 h-2 rounded-full bg-black/8">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Number(item.hours) || 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminReportsPage() {
  return (
    <AdminShell title="Отчёты" description="Экспорт управленческой отчётности по программе корпоративного волонтёрства.">
      <div className="grid gap-4 md:grid-cols-2">
        {["Сводка по фондам", "Часы по волонтёрам", "Активности по категориям", "Модерационные решения"].map((title) => (
          <div key={title} className="flex items-center justify-between rounded-[1.35rem] bg-white/70 p-5">
            <div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-1 text-sm text-black/52">CSV / Excel</p>
            </div>
            <Download className="size-6" />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function FoundationList() {
  const { data: funds = [], isLoading } = useQuery({ queryKey: ["admin", "funds"], queryFn: () => adminApi.funds() });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {funds.map((foundation) => (
        <div key={foundation.id} className="rounded-[1.35rem] bg-white/70 p-5">
          <StatusPill tone={foundation.status === "approved" ? "green" : "gold"}>{foundation.status}</StatusPill>
          <h3 className="mt-4 text-xl font-black">{foundation.name}</h3>
          <p className="mt-2 text-sm leading-6 text-black/58">{foundation.contact_person ?? foundation.region ?? "Данные фонда получены из backend"}</p>
        </div>
      ))}
      {!funds.length ? <EmptyState isLoading={isLoading} /> : null}
    </div>
  );
}

function AdminShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { data: dashboard } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => adminApi.dashboard() });

  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Администрирование" title={title} description={description} tone="dark" />
      <MetricStrip
        items={[
          { icon: UsersRound, value: `${dashboard?.applications_total ?? 0}`, label: "откликов" },
          { icon: Clock, value: `${dashboard?.awarded_hours_total ?? 0}`, label: "часов помощи" },
          { icon: Building2, value: `${dashboard?.funds_total ?? 0}`, label: "фондов и НКО" },
          { icon: ShieldCheck, value: `${(dashboard?.funds_pending_review ?? 0) + (dashboard?.tasks_pending_review ?? 0)}`, label: "на модерации" }
        ]}
      />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}

function fundToListItem(item: ApiAdminFund) {
  return {
    title: item.name,
    meta: item.region ?? "Регион не указан",
    text: `Куратор: ${item.contact_person ?? "не указан"}. ${item.moderation_comment ?? "Комментариев модерации нет."}`,
    status: item.status
  };
}

function taskToListItem(task: ApiAdminTask) {
  return {
    title: task.title,
    meta: `${task.category} / ${task.city ?? "город не указан"}`,
    text: `${task.expected_hours} часов, лимит участников: ${task.participant_limit ?? "не ограничен"}.`,
    status: task.status
  };
}

function applicationToListItem(item: ApiAdminApplication) {
  return {
    title: item.volunteer_id,
    meta: item.task_id,
    text: `Статус участия: ${item.status}. ${item.fund_comment ?? item.volunteer_comment ?? "Комментариев нет."}`,
    status: item.status
  };
}

function completionToListItem(item: ApiAdminCompletion) {
  return {
    title: item.volunteer.full_name ?? item.volunteer.email,
    meta: item.task.title,
    text: `Фонд подтвердил участие. Нужно проверить ${item.task.expected_hours} часов и дату события.`,
    status: item.status
  };
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return <p className="rounded-[1.1rem] bg-white/60 p-4 text-sm font-bold text-black/54">{isLoading ? "Загружаем данные..." : "Данных пока нет."}</p>;
}
