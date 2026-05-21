"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCircle2, Download, FileBarChart, Search, Star, XCircle } from "lucide-react";
import {
  adminHourCases,
  adminNotifications,
  adminVolunteers,
  analyticsBars,
  applicationStatusConfig,
  type AdminHourCase
} from "@/widgets/admin/admin-data";
import { AdminKpiCard } from "@/widgets/admin/ui/admin-kpi-card";
import { AdminPageShell } from "@/widgets/admin/ui/admin-page-shell";
import { AdminStatusBadge, AdminSoftSurface } from "@/widgets/admin/ui/admin-status-badge";

export function AdminHoursPage() {
  const [cases, setCases] = useState<AdminHourCase[]>(adminHourCases);

  function approve(id: string, hours: number) {
    setCases((items) => items.map((item) => item.id === id ? { ...item, status: "approved", approvedHours: hours } : item));
  }

  function reject(id: string) {
    setCases((items) => items.map((item) => item.id === id ? { ...item, status: "rejected" } : item));
  }

  return (
    <AdminPageShell eyebrow="Начисление часов" title="Контроль завершённых участий" description="Фонд подтверждает факт участия, администратор проверяет и только после этого начисляет часы.">
      <section className="grid gap-4">
        {cases.map((item) => <HourCaseCard key={item.id} item={item} onApprove={approve} onReject={reject} />)}
      </section>
    </AdminPageShell>
  );
}

export function AdminVolunteersPage() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => adminVolunteers.filter((item) => `${item.name} ${item.city} ${item.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <AdminPageShell eyebrow="Волонтёры" title="Профили участников" description="Поиск по сотрудникам, навыкам, городам, часам и истории участия.">
      <SearchInput value={query} onChange={setQuery} placeholder="Искать волонтёра, город или навык" />
      <section className="grid gap-4 xl:grid-cols-3">
        {visible.map((volunteer) => (
          <article key={volunteer.id} className="rounded-[1.6rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
            <div className="flex items-start gap-4">
              <Image src={volunteer.avatar} alt={volunteer.name} width={72} height={72} className="size-16 rounded-[1.25rem] object-cover" />
              <div>
                <AdminStatusBadge tone={volunteer.status === "active" ? "success" : "wait"}>{volunteer.status === "active" ? "Активен" : "Новый"}</AdminStatusBadge>
                <h2 className="mt-3 text-xl font-black">{volunteer.name}</h2>
                <p className="mt-1 text-sm font-bold text-black/48">{volunteer.role} · {volunteer.city}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric value={`${volunteer.hours}`} label="часов" />
              <Metric value={`${volunteer.activities}`} label="активностей" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {volunteer.skills.map((skill) => <span key={skill} className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/54">{skill}</span>)}
            </div>
            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-black">
              Открыть профиль
              <ArrowRight className="size-4" />
            </button>
          </article>
        ))}
      </section>
    </AdminPageShell>
  );
}

export function AdminAnalyticsPage() {
  const metrics = [
    { label: "Фонды", value: "200+", helper: "42 активны в мае", icon: FileBarChart, tone: "review" as const },
    { label: "Волонтёры", value: "10 000+", helper: "342 активны за месяц", icon: Star, tone: "brand" as const },
    { label: "Задания", value: "118", helper: "48 опубликовано", icon: CheckCircle2, tone: "success" as const },
    { label: "Конверсия отклика", value: "67%", helper: "в принятие", icon: ArrowRight, tone: "done" as const }
  ];

  return (
    <AdminPageShell eyebrow="Аналитика" title="Пульс платформы" description="Ключевые показатели по фондам, заданиям, откликам, категориям и подтверждённым часам.">
      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => <AdminKpiCard key={metric.label} {...metric} />)}
      </section>
      <section className="grid gap-5 rounded-[1.7rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)] lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-2xl font-black">Динамика по контуру</h2>
          <div className="mt-7 flex h-64 items-end gap-5 rounded-[1.35rem] bg-[#fffdf7] p-5">
            {analyticsBars.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${item.value * 2}px` }} />
                <span className="text-xs font-black text-black/54">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {analyticsBars.map((item) => (
            <div key={item.label} className="rounded-[1.2rem] bg-[#fffdf7] p-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <p className="mt-1 text-xs font-bold text-black/42">{item.caption}</p>
              <div className="mt-3 h-2 rounded-full bg-black/8">
                <div className="h-full rounded-full bg-brand" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}

export function AdminReportsPage() {
  const reports = ["Сводка по фондам", "Часы по волонтёрам", "Активности по категориям", "Модерационные решения", "Конверсия откликов", "Завершённые участия"];

  return (
    <AdminPageShell eyebrow="Отчёты" title="Экспорт и отчётность" description="Подготовленный UI для CSV/Excel. Реальный экспорт подключится на backend-этапе.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((title) => (
          <article key={title} className="rounded-[1.45rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand">
              <Download className="size-5" />
            </span>
            <h2 className="mt-5 text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm font-bold text-black/46">CSV / Excel</p>
            <button disabled className="mt-5 h-11 w-full rounded-xl bg-[#f4f3ee] text-sm font-black text-black/34">Экспорт будет доступен позже</button>
          </article>
        ))}
      </section>
    </AdminPageShell>
  );
}

export function AdminNotificationsPage() {
  const unreadCount = adminNotifications.filter((item) => item.unread).length;

  return (
    <AdminPageShell eyebrow="Уведомления" title="События администратора" description="Новые фонды, задания на модерации, завершённые участия и исправления от фондов.">
      <section className="rounded-[1.7rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge tone="brand">Все {adminNotifications.length}</AdminStatusBadge>
          <AdminStatusBadge tone="review">Непрочитанные {unreadCount}</AdminStatusBadge>
        </div>
        <div className="mt-5 space-y-3">
          {adminNotifications.map((item) => (
            <Link key={item.id} href={item.target} className="grid gap-4 rounded-[1.35rem] bg-[#fffdf7] p-4 transition hover:-translate-y-0.5 hover:bg-brand/12 md:grid-cols-[56px_1fr_auto] md:items-center">
              <span className="relative grid size-12 place-items-center rounded-2xl bg-white">
                <Bell className="size-5" />
                {item.unread ? <span className="absolute right-2 top-2 size-2 rounded-full bg-brand" /> : null}
              </span>
              <div>
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-1 text-sm font-bold leading-6 text-black/52">{item.text}</p>
              </div>
              <span className="text-xs font-black text-black/36">{item.time}</span>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}

function HourCaseCard({ item, onApprove, onReject }: { item: AdminHourCase; onApprove: (id: string, hours: number) => void; onReject: (id: string) => void }) {
  const [hours, setHours] = useState(item.approvedHours);
  const status = item.status === "approved" ? applicationStatusConfig.hoursAdded : item.status === "rejected" ? applicationStatusConfig.rejected : applicationStatusConfig.waitingHours;

  return (
    <article className="rounded-[1.6rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
        <div className="flex items-start gap-4">
          <Image src={item.volunteerAvatar} alt={item.volunteer} width={72} height={72} className="size-16 rounded-[1.25rem] object-cover" />
          <div>
            <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
            <h2 className="mt-3 text-2xl font-black">{item.volunteer}</h2>
            <p className="mt-1 text-sm font-bold text-black/48">{item.taskTitle} · {item.foundation}</p>
            <p className="mt-3 text-sm font-bold leading-6 text-black/52">{item.note}</p>
          </div>
        </div>
        <AdminSoftSurface tone={item.status === "approved" ? "success" : "revision"}>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">Подтверждение фонда</p>
          <p className="mt-2 text-sm font-black">{item.confirmedByFoundation}</p>
          <div className="mt-4 flex items-center gap-3">
            <input type="number" min={0} value={hours} onChange={(event) => setHours(Number(event.target.value))} className="h-11 w-24 rounded-xl bg-white px-3 text-sm font-black outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]" />
            <span className="text-sm font-black text-black/52">часов</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onApprove(item.id, hours)} className="h-10 rounded-xl bg-brand text-xs font-black text-black">Начислить</button>
            <button onClick={() => onReject(item.id)} className="h-10 rounded-xl bg-[#fff1f1] text-xs font-black text-[#c83c3c]">Отклонить</button>
          </div>
        </AdminSoftSurface>
      </div>
    </article>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-12 max-w-2xl items-center gap-3 rounded-full bg-white px-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06),0_14px_36px_rgba(34,28,8,0.04)]">
      <Search className="size-5 text-black/54" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/34" />
    </label>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.1rem] bg-[#fffdf7] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black text-black/38">{label}</p>
    </div>
  );
}
