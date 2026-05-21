"use client";

import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { adminFoundations, adminHourCases, adminKpis, adminNotifications, adminTasks } from "@/widgets/admin/admin-data";
import { AdminKpiCard } from "@/widgets/admin/ui/admin-kpi-card";
import { AdminPageShell } from "@/widgets/admin/ui/admin-page-shell";
import { AdminStatusBadge } from "@/widgets/admin/ui/admin-status-badge";
import { foundationStatusConfig, taskStatusConfig } from "@/widgets/admin/admin-data";

export function AdminDashboardPage() {
  const pendingFoundations = adminFoundations.filter((item) => item.status === "pending" || item.status === "revision");
  const pendingTasks = adminTasks.filter((item) => item.status === "moderation" || item.status === "returned");
  const hourCases = adminHourCases.filter((item) => item.status === "ready" || item.status === "needsCheck");

  return (
    <AdminPageShell
      eyebrow="Администрирование"
      title="Центр управления платформой"
      description="Модерация фондов, проверка заданий, контроль завершённых активностей и начисление часов в одном рабочем контуре."
      action={<QuickActions />}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminKpis.map((item) => <AdminKpiCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="rounded-[1.7rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <SectionTitle title="Требуют внимания сейчас" text="Фонды, задания и завершённые активности, где нужно решение администратора." />
          <div className="mt-5 grid gap-3">
            {pendingFoundations.map((foundation) => {
              const status = foundationStatusConfig[foundation.status];
              return (
                <ActionRow key={foundation.id} href="/admin/moderation/foundations" title={foundation.name} text={`${foundation.region} · ${foundation.categories.join(", ")}`} status={status.label} tone={status.tone} icon={ShieldCheck} />
              );
            })}
            {pendingTasks.map((task) => {
              const status = taskStatusConfig[task.status];
              return (
                <ActionRow key={task.id} href="/admin/moderation/tasks" title={task.title} text={`${task.foundation} · ${task.category} · ${task.hours} ч`} status={status.label} tone={status.tone} icon={Clock3} />
              );
            })}
            {hourCases.map((item) => (
              <ActionRow key={item.id} href="/admin/hours" title={item.volunteer} text={`${item.taskTitle} · фонд подтвердил ${item.requestedHours} ч`} status="Начислить часы" tone="revision" icon={CheckCircle2} />
            ))}
          </div>
        </div>

        <aside className="rounded-[1.7rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <SectionTitle title="Уведомления" text="Новые события по модерации и часам." href="/admin/notifications" />
          <div className="mt-5 space-y-3">
            {adminNotifications.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.target} className="group block rounded-[1.2rem] bg-[#fffdf7] p-4 transition hover:-translate-y-0.5 hover:bg-brand/12">
                <div className="flex items-center gap-2">
                  {item.unread ? <span className="size-2 rounded-full bg-brand" /> : null}
                  <p className="text-sm font-black">{item.title}</p>
                  <span className="ml-auto text-[11px] font-bold text-black/38">{item.time}</span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-black/50">{item.text}</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </AdminPageShell>
  );
}

function QuickActions() {
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
      <Link href="/admin/moderation/foundations" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black">
        Фонды
        <ArrowRight className="size-4" />
      </Link>
      <Link href="/admin/moderation/tasks" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)]">Модерация заданий</Link>
      <Link href="/admin/hours" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)]">
        <Bell className="size-4" />
        Часы
      </Link>
    </div>
  );
}

function ActionRow({ href, title, text, status, tone, icon: Icon }: { href: string; title: string; text: string; status: string; tone: Parameters<typeof AdminStatusBadge>[0]["tone"]; icon: typeof ShieldCheck }) {
  return (
    <Link href={href} className="grid gap-3 rounded-[1.25rem] bg-[#fffdf7] p-4 transition hover:-translate-y-0.5 hover:bg-brand/12 md:grid-cols-[44px_1fr_auto] md:items-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-white">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-base font-black">{title}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-black/48">{text}</p>
      </div>
      <AdminStatusBadge tone={tone}>{status}</AdminStatusBadge>
    </Link>
  );
}

function SectionTitle({ title, text, href }: { title: string; text: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-1 max-w-xl text-sm font-bold leading-6 text-black/48">{text}</p>
      </div>
      {href ? <Link href={href} className="shrink-0 text-sm font-black text-black/44 hover:text-black">Открыть →</Link> : null}
    </div>
  );
}
