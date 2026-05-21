"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Bell, CheckCircle2, Clock3, Download, FileBarChart, MapPin, Search, Star, XCircle } from "lucide-react";
import { adminService, volunteersService } from "@/shared/api";
import { mapAdminCompletionItem, mapAdminNotification, mapAdminVolunteerDirectoryItem } from "@/widgets/admin/admin-api-mappers";
import {
  adminHourCases,
  adminNotifications,
  adminVolunteers,
  analyticsBars,
  applicationStatusConfig,
  type AdminHourCase,
  type AdminNotification,
  type AdminVolunteer
} from "@/widgets/admin/admin-data";
import { AdminKpiCard } from "@/widgets/admin/ui/admin-kpi-card";
import { AdminDetailOverlay } from "@/widgets/admin/ui/admin-detail-overlay";
import { AdminPageShell } from "@/widgets/admin/ui/admin-page-shell";
import { AdminStatusBadge, AdminSoftSurface } from "@/widgets/admin/ui/admin-status-badge";
import { achievementDefinitions } from "@/widgets/volunteer-achievements/achievement-data";

export function AdminHoursPage() {
  const [cases, setCases] = useState<AdminHourCase[]>(adminHourCases);

  useEffect(() => {
    let active = true;

    async function loadWaitingHours() {
      try {
        const items = await adminService.getAdminCompletionsWaitingHours(50);
        const mapped = await Promise.all(
          items.map(async (item) => {
            try {
              const task = await adminService.getAdminTask(item.task_id);
              return mapAdminCompletionItem(item, task.fund.name);
            } catch {
              return mapAdminCompletionItem(item);
            }
          })
        );

        if (active) {
          setCases(mapped);
        }
      } catch {
        // Keep existing UI data if the API is unavailable or the admin is not authenticated.
      }
    }

    void loadWaitingHours();

    return () => {
      active = false;
    };
  }, []);

  async function approve(id: string, hours: number) {
    try {
      await adminService.awardAdminHours(id, { hours });
      setCases((items) => items.filter((item) => item.id !== id));
    } catch {
      // Do not fake awarded hours locally: backend must confirm the operation.
    }
  }

  return (
    <AdminPageShell eyebrow="Начисление часов" title="Контроль завершённых участий" description="Фонд подтверждает факт участия, администратор проверяет и только после этого начисляет часы.">
      <section className="grid gap-4">
        {cases.map((item) => <HourCaseCard key={item.id} item={item} onApprove={approve} />)}
      </section>
    </AdminPageShell>
  );
}

export function AdminVolunteersPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminVolunteer[]>(adminVolunteers);
  const visible = useMemo(() => items.filter((item) => `${item.name} ${item.city} ${item.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  useEffect(() => {
    let active = true;

    async function loadVolunteers() {
      try {
        const volunteers = await adminService.getAdminVolunteers({
          limit: 50,
          offset: 0,
          search: query.trim().length >= 2 ? query.trim() : undefined
        });
        const mapped = await Promise.all(
          volunteers.map(async (volunteer) => {
            try {
              return mapAdminVolunteerDirectoryItem(volunteer, await volunteersService.getPublicVolunteerProfile(volunteer.id));
            } catch {
              return mapAdminVolunteerDirectoryItem(volunteer);
            }
          })
        );

        if (active) {
          setItems(mapped);
        }
      } catch {
        // Keep existing UI data if the API is unavailable or the admin is not authenticated.
      }
    }

    void loadVolunteers();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <AdminPageShell eyebrow="Волонтёры" title="Профили участников" description="Поиск по сотрудникам, навыкам, городам, часам и истории участия.">
      <SearchInput value={query} onChange={setQuery} placeholder="Искать волонтёра, город или навык" />
      <section className="grid gap-4 xl:grid-cols-3">
        {visible.map((volunteer) => (
          <article key={volunteer.id} className="rounded-[1.6rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(34,28,8,0.075)]">
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
            <Link href={`/profile/${volunteer.id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-black">
              Открыть профиль
              <ArrowRight className="size-4" />
            </Link>
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
  const [notifications, setNotifications] = useState<AdminNotification[]>(adminNotifications);
  const unreadCount = notifications.filter((item) => item.unread).length;

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const items = await adminService.getAdminNotifications({ limit: 50, offset: 0 });
        if (!active) return;
        setNotifications(items.map(mapAdminNotification));
      } catch {
        // Keep existing UI data if the API is unavailable or the admin is not authenticated.
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  function markRead(id: string) {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, unread: false } : item));
    void adminService.markAdminNotificationRead(id);
  }

  return (
    <AdminPageShell eyebrow="Уведомления" title="События администратора" description="Новые фонды, задания на модерации, завершённые участия и исправления от фондов.">
      <section className="rounded-[1.7rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge tone="brand">Все {notifications.length}</AdminStatusBadge>
          <AdminStatusBadge tone="review">Непрочитанные {unreadCount}</AdminStatusBadge>
        </div>
        <div className="mt-5 space-y-3">
          {notifications.map((item) => (
            <Link key={item.id} href={item.target} onClick={() => markRead(item.id)} className="grid gap-4 rounded-[1.35rem] bg-[#fffdf7] p-4 transition hover:-translate-y-0.5 hover:bg-brand/12 md:grid-cols-[56px_1fr_auto] md:items-center">
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

function HourCaseCard({ item, onApprove }: { item: AdminHourCase; onApprove: (id: string, hours: number) => void }) {
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
          <div className="mt-4">
            <button onClick={() => onApprove(item.id, hours)} className="h-10 w-full rounded-xl bg-brand text-xs font-black text-black">Начислить</button>
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

function VolunteerProfilePreview({ volunteer }: { volunteer: AdminVolunteer }) {
  const badgeImages = volunteer.badges
    .map((title) => achievementDefinitions.find((achievement) => achievement.title === title))
    .filter((achievement): achievement is NonNullable<typeof achievement> => Boolean(achievement));

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.55rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-35 md:block" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center">
          <Image src={volunteer.avatar} alt={volunteer.name} width={132} height={132} className="size-32 rounded-[1.8rem] object-cover shadow-[0_20px_50px_rgba(34,28,8,0.12)]" />
          <div className="min-w-0 flex-1">
            <AdminStatusBadge tone={volunteer.status === "active" ? "success" : "wait"}>{volunteer.status === "active" ? "Активен" : "Новый"}</AdminStatusBadge>
            <h3 className="mt-3 text-4xl font-black leading-tight text-black">{volunteer.name}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-black/56">
              <span>{volunteer.role}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{volunteer.city}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ProfileMetric icon={Clock3} value={`${volunteer.hours}`} label="волонтёрских часов" />
        <ProfileMetric icon={CheckCircle2} value={`${volunteer.activities}`} label="заданий завершено" />
        <ProfileMetric icon={Award} value={`${volunteer.badges.length}`} label="бейджа получено" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[1.55rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <h3 className="text-xl font-black">Навыки и интересы</h3>
          <ChipGroup title="Интересы" items={volunteer.interests} />
          <ChipGroup title="Навыки" items={volunteer.skills} />
          <ChipGroup title="Pro bono" items={volunteer.proSkills} />
        </div>
        <div className="rounded-[1.55rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <h3 className="text-xl font-black">Бейджи</h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {badgeImages.map((badge) => (
              <div key={badge.id} className="text-center">
                <div className="relative mx-auto flex h-24 items-center justify-center">
                  <span className="absolute bottom-3 h-9 w-16 rounded-full bg-brand/24 blur-xl" />
                  <Image src={badge.icon} alt={badge.title} width={88} height={88} className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_16px_22px_rgba(34,28,8,0.16)]" />
                </div>
                <p className="mt-2 text-xs font-black leading-4">{badge.title}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-xl font-black">История участия</h3>
          <div className="mt-4 space-y-2">
            {volunteer.history.map((item) => (
              <div key={item} className="rounded-[1rem] bg-[#fffdf7] px-4 py-3 text-sm font-black text-black/62">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.55rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <h3 className="text-xl font-black">Участие по категориям</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {volunteer.categories.map((category) => (
            <div key={category.label} className="rounded-[1.15rem] bg-[#fffdf7] p-4">
              <div className="flex items-center justify-between gap-3 text-sm font-black">
                <span>{category.label}</span>
                <span>{category.value}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-black/8">
                <div className="h-full rounded-full bg-brand" style={{ width: `${category.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileMetric({ icon: Icon, value, label }: { icon: typeof Clock3; value: string; label: string }) {
  return (
    <div className="rounded-[1.35rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-black/46">{label}</p>
    </div>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm font-black text-black/44">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/56">{item}</span>)}
      </div>
    </div>
  );
}
