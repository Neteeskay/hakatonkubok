"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Download, Plus, ShieldCheck } from "lucide-react";
import {
  currentFoundation,
  foundationApplications,
  foundationMetrics,
  foundationTasks,
  reportMetrics,
  type FoundationApplicationItem,
  type FoundationApplicationStatus,
  type FoundationTaskItem,
  type FoundationTaskStatus
} from "@/widgets/foundation/foundation-data";
import { CreateTaskForm } from "@/widgets/foundation/ui/create-task-form";
import { FoundationApplicationCard } from "@/widgets/foundation/ui/foundation-application-card";
import { FoundationMetricCard } from "@/widgets/foundation/ui/foundation-metric-card";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";
import { FoundationTaskCard } from "@/widgets/foundation/ui/foundation-task-card";
import { FoundationTaskEditor } from "@/widgets/foundation/ui/foundation-task-editor";
import { FoundationProfileWorkspace } from "@/widgets/foundation/ui/foundation-profile-workspace";

export function FoundationDashboardPage() {
  const urgentApplications = foundationApplications.filter((item) => item.status === "review" || item.status === "clarify");
  const activeTasks = foundationTasks.filter((task) => task.status === "published" || task.status === "returned");

  return (
    <FoundationPageShell
      eyebrow="Кабинет фонда"
      title="Управляйте помощью без лишней рутины"
      description="Создавайте задания, принимайте участников, подтверждайте факт участия и держите модерацию под контролем."
      action={<Link href="/foundation/create-task" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black shadow-[0_16px_38px_rgba(255,227,0,0.24)]"><Plus className="size-4" />Создать задание</Link>}
    >
      <Metrics />

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <section className="space-y-4">
          <SectionHeader title="Задания, требующие внимания" text="Опубликованные активности и задания, которые нужно доработать после модерации." href="/foundation/tasks" />
          {activeTasks.slice(0, 3).map((task) => <FoundationTaskCard key={task.id} task={task} />)}
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-[1.6rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
            <div className="bg-brand p-5">
              <ShieldCheck className="size-7" />
              <h2 className="mt-4 text-2xl font-black leading-tight">Фонд одобрен</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-black/60">Можно создавать задания. Каждая публикация всё равно проходит модерацию администратора.</p>
            </div>
            <div className="p-5">
              <Link href="/foundation/moderation" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#fffdf7] text-xs font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)]">
                Проверить статусы публикаций
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[1.6rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
            <SectionHeader title="Ожидают решения" text="Заявки, которые нельзя оставлять без ответа." href="/foundation/participants" compact />
            <div className="mt-4 space-y-3">
              {urgentApplications.map((item) => (
                <Link key={item.id} href="/foundation/participants" className="block rounded-[1.15rem] bg-[#fffdf7] p-4 transition hover:bg-brand/12">
                  <p className="text-sm font-black">{item.volunteer}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-black/48">{item.taskTitle}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </FoundationPageShell>
  );
}

export function FoundationTasksPage() {
  const [tasks, setTasks] = useState<FoundationTaskItem[]>(foundationTasks);
  const [activeStatus, setActiveStatus] = useState<"all" | FoundationTaskStatus>("all");
  const [editingTask, setEditingTask] = useState<FoundationTaskItem | null>(null);
  const visibleTasks = activeStatus === "all" ? tasks : tasks.filter((task) => task.status === activeStatus);
  const saveTask = (updates: Partial<FoundationTaskItem>) => {
    if (!editingTask) return;
    setTasks((items) => items.map((task) => task.id === editingTask.id ? { ...task, ...updates } : task));
  };

  return (
    <FoundationPageShell
      eyebrow="Задания фонда"
      title="Публикации и модерация"
      description="Здесь фонд создаёт задания, редактирует черновики, отправляет на модерацию, дорабатывает и закрывает активности."
      action={<Link href="/foundation/create-task" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black"><Plus className="size-4" />Новое задание</Link>}
    >
      <TaskStatusFilters active={activeStatus} onChange={setActiveStatus} />
      <div className="space-y-4">
        {visibleTasks.map((task) => <FoundationTaskCard key={task.id} task={task} onEdit={setEditingTask} />)}
      </div>
      {editingTask ? <FoundationTaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
    </FoundationPageShell>
  );
}

export function CreateTaskPage() {
  return (
    <FoundationPageShell
      eyebrow="Создание задания"
      title="Новая активность для волонтёров"
      description="Опишите неденежную помощь, требования, сроки, контакты после принятия и ожидаемый результат."
    >
      <CreateTaskForm canPublish={currentFoundation.moderationStatus === "approved"} />
    </FoundationPageShell>
  );
}

export function FoundationParticipantsPage() {
  const [applications, setApplications] = useState<FoundationApplicationItem[]>(foundationApplications);
  const setApplicationStatus = (id: string, status: FoundationApplicationStatus) => {
    setApplications((items) => items.map((item) => item.id === id ? { ...item, status, comment: applicationCommentByStatus(status), nextStep: applicationNextStepByStatus(status) } : item));
  };

  return (
    <FoundationPageShell
      eyebrow="Отклики и участие"
      title="Участники заданий"
      description="Единый рабочий раздел: рассмотрите отклики, запросите уточнение, примите участника и после активности подтвердите факт участия."
    >
      <div className="space-y-5">
        {foundationTasks.map((task) => {
          const taskApplications = applications.filter((item) => item.taskId === task.taskId || item.taskTitle === task.title);
          if (!taskApplications.length) return null;
          return <TaskApplicationsSection key={task.id} task={task} applications={taskApplications} onStatusChange={setApplicationStatus} />;
        })}
      </div>
    </FoundationPageShell>
  );
}

export const FoundationApplicationsPage = FoundationParticipantsPage;
export const FoundationVolunteersPage = FoundationParticipantsPage;

export function FoundationModerationPage() {
  const [tasks, setTasks] = useState<FoundationTaskItem[]>(foundationTasks);
  const [activeStatus, setActiveStatus] = useState<"all" | FoundationTaskStatus>("all");
  const [editingTask, setEditingTask] = useState<FoundationTaskItem | null>(null);
  const moderationTasks = tasks.filter((task) => task.status !== "published" || task.moderationComment);
  const visibleTasks = activeStatus === "all" ? moderationTasks : moderationTasks.filter((task) => task.status === activeStatus);
  const saveTask = (updates: Partial<FoundationTaskItem>) => {
    if (!editingTask) return;
    setTasks((items) => items.map((task) => task.id === editingTask.id ? { ...task, ...updates } : task));
  };

  return (
    <FoundationPageShell
      eyebrow="Модерация"
      title="Статусы публикаций"
      description="Понимайте, что уже опубликовано, что ожидает проверки, а что нужно доработать и отправить повторно."
    >
      <TaskStatusFilters active={activeStatus} onChange={setActiveStatus} />
      <div className="space-y-4">
        {visibleTasks.map((task) => <FoundationTaskCard key={task.id} task={task} onEdit={setEditingTask} />)}
      </div>
      {editingTask ? <FoundationTaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
    </FoundationPageShell>
  );
}

export function FoundationReportsPage() {
  return (
    <FoundationPageShell
      eyebrow="Отчётность"
      title="Аналитика фонда"
      description="Следите за заданиями, откликами, принятыми участниками, завершёнными активностями и подтверждёнными часами."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {reportMetrics.map((metric) => <FoundationMetricCard key={metric.label} {...metric} />)}
      </div>
      <section className="grid gap-5 overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)] lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader title="Эффективность активностей" text="Динамика откликов и подтверждённых участий за последние месяцы." />
          <div className="mt-8 flex h-56 items-end gap-5 rounded-[1.35rem] bg-[#fffdf7] p-5">
            {[42, 58, 74, 63, 86, 79].map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${value * 2}px` }} />
                <span className="text-xs font-bold text-black/42">{["Янв", "Фев", "Мар", "Апр", "Май", "Июн"][index]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fffdf7] p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Экспорт отчётов</p>
          <div className="mt-4 space-y-3">
            {["CSV по откликам", "Excel по участникам", "Отчёт по часам"].map((item) => (
              <button key={item} disabled className="flex h-14 w-full items-center justify-between rounded-xl bg-white px-4 text-sm font-black text-black/34 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
                {item}
                <Download className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </FoundationPageShell>
  );
}

export function FoundationProfilePage() {
  return (
    <FoundationPageShell eyebrow="Профиль фонда" title={currentFoundation.name} description={currentFoundation.description}>
      <FoundationProfileWorkspace />
    </FoundationPageShell>
  );
}

function FoundationPageShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-6 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-70 lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-gradient-to-r from-white via-white/82 to-transparent lg:block" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-black/58">{description}</p>
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}

function Metrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {foundationMetrics.map((metric) => <FoundationMetricCard key={metric.label} {...metric} />)}
    </div>
  );
}

function TaskApplicationsSection({
  task,
  applications,
  onStatusChange
}: {
  task: FoundationTaskItem;
  applications: FoundationApplicationItem[];
  onStatusChange: (id: string, status: FoundationApplicationStatus) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
      <div className="grid gap-4 bg-[#fffdf7] p-4 lg:grid-cols-[1fr_220px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FoundationStatusBadge tone={task.status === "published" ? "green" : task.status === "returned" ? "violet" : "blue"}>{task.status === "published" ? "Опубликовано" : task.status === "returned" ? "На доработке" : "На модерации"}</FoundationStatusBadge>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-black/50">{applications.length} отклика</span>
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight">{task.title}</h2>
          <p className="mt-2 text-sm font-bold text-black/50">{task.period} · {task.city} · {task.participants}/{task.capacity} участников</p>
        </div>
        <Link href="/foundation/tasks" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-black text-black">
          Открыть задание
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="space-y-3 p-4">
        {applications.map((item) => <FoundationApplicationCard key={item.id} item={item} onStatusChange={onStatusChange} />)}
      </div>
    </section>
  );
}

function TaskStatusFilters({ active, onChange }: { active: "all" | FoundationTaskStatus; onChange: (status: "all" | FoundationTaskStatus) => void }) {
  const filters: { label: string; value: "all" | FoundationTaskStatus }[] = [
    { label: "Все", value: "all" },
    { label: "Черновики", value: "draft" },
    { label: "На модерации", value: "moderation" },
    { label: "Опубликовано", value: "published" },
    { label: "На доработке", value: "returned" },
    { label: "Завершено", value: "completed" }
  ];

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-[1.45rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      {filters.map((item) => (
        <button key={item.value} onClick={() => onChange(item.value)} className={`h-10 rounded-xl px-4 text-sm font-black transition ${active === item.value ? "bg-brand text-black shadow-[0_12px_24px_rgba(255,227,0,0.2)]" : "bg-[#faf9f4] text-black/58 hover:bg-brand/12 hover:text-black"}`}>{item.label}</button>
      ))}
    </section>
  );
}

function applicationCommentByStatus(status: FoundationApplicationStatus) {
  const comments: Record<FoundationApplicationStatus, string> = {
    review: "Заявка ожидает решения фонда.",
    accepted: "Заявка принята. Контакты и инструкции доступны волонтёру.",
    clarify: "Фонд запросил уточнение перед финальным решением.",
    rejected: "Заявка отклонена с комментарием фонда.",
    completed: "Участие отмечено как завершённое.",
    confirmed: "Участие подтверждено фондом."
  };
  return comments[status];
}

function applicationNextStepByStatus(status: FoundationApplicationStatus) {
  const steps: Record<FoundationApplicationStatus, string> = {
    review: "Примите решение по заявке",
    accepted: "Дождитесь активности и подтвердите участие",
    clarify: "Дождитесь ответа волонтёра",
    rejected: "Заявка закрыта",
    completed: "Проверьте результат участия",
    confirmed: "Участие закрыто"
  };
  return steps[status];
}

function SectionHeader({ title, text, href, compact = false }: { title: string; text: string; href?: string; compact?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>{title}</h2>
        <p className="mt-1 max-w-xl text-sm font-bold leading-6 text-black/48">{text}</p>
      </div>
      {href ? <Link href={href} className="shrink-0 text-sm font-black text-black/48 hover:text-black">Открыть →</Link> : null}
    </div>
  );
}
