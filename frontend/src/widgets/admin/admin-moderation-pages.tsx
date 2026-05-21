"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { adminService } from "@/shared/api";
import { mapAdminFundDetail, mapAdminFundListItem, mapAdminTaskDetail, mapAdminTaskDirectoryItem } from "@/widgets/admin/admin-api-mappers";
import {
  adminFoundations,
  adminTasks,
  foundationStatusConfig,
  taskStatusConfig,
  type AdminFoundation,
  type AdminFoundationStatus,
  type AdminTask,
  type AdminTaskStatus
} from "@/widgets/admin/admin-data";
import { AdminDetailOverlay } from "@/widgets/admin/ui/admin-detail-overlay";
import { AdminPageShell } from "@/widgets/admin/ui/admin-page-shell";
import { FoundationReviewPanel, TaskReviewPanel } from "@/widgets/admin/ui/admin-review-panels";
import { AdminStatusBadge } from "@/widgets/admin/ui/admin-status-badge";

export function AdminFoundationModerationPage() {
  const [items, setItems] = useState<AdminFoundation[]>(adminFoundations);
  const [active, setActive] = useState<"all" | AdminFoundationStatus>("all");
  const [selected, setSelected] = useState<AdminFoundation | null>(null);
  const visible = active === "all" ? items : items.filter((item) => item.status === active);

  useEffect(() => {
    let isMounted = true;

    async function loadFunds() {
      try {
        const funds = await adminService.getAdminFunds({ limit: 50, offset: 0 });
        const detailedFunds = await Promise.all(
          funds.map(async (fund) => {
            try {
              return mapAdminFundDetail(await adminService.getAdminFund(fund.id));
            } catch {
              return mapAdminFundListItem(fund);
            }
          })
        );

        if (isMounted) {
          setItems(detailedFunds);
        }
      } catch {
        // Keep the existing mock data if the API is unavailable or the admin is not authenticated.
      }
    }

    void loadFunds();

    return () => {
      isMounted = false;
    };
  }, []);

  async function moderateFoundation(id: string, status: "approved" | "needs_changes" | "rejected", comment?: string) {
    try {
      const updated = mapAdminFundDetail(await adminService.moderateAdminFund(id, { comment, target_status: status }));
      setItems((current) => current.map((item) => item.id === id ? updated : item));
      setSelected(null);
    } catch {
      // Do not fake moderation state locally: status/comment must come from backend.
    }
  }

  async function openFoundation(foundation: AdminFoundation) {
    try {
      setSelected(mapAdminFundDetail(await adminService.getAdminFund(foundation.id)));
    } catch {
      setSelected(foundation);
    }
  }

  return (
    <AdminPageShell eyebrow="Модерация фондов" title="Проверка организаций" description="Проверяйте данные фонда, документы, контакты и принимайте понятное решение без переключения контекста.">
      <FoundationFilters active={active} onChange={setActive} />
      <section className="grid gap-4 xl:grid-cols-2">
        {visible.map((foundation) => <FoundationModerationCard key={foundation.id} foundation={foundation} onOpen={(item) => void openFoundation(item)} />)}
      </section>
      {selected ? (
        <AdminDetailOverlay
          eyebrow="Модерация фонда"
          title={selected.name}
          description="Полная заявка фонда: данные регистрации, контакты, документы и решение администратора."
          onClose={() => setSelected(null)}
        >
          <FoundationReviewPanel
            foundation={selected}
            onApprove={() => void moderateFoundation(selected.id, "approved")}
            onRevision={(comment) => void moderateFoundation(selected.id, "needs_changes", comment)}
            onReject={(comment) => void moderateFoundation(selected.id, "rejected", comment)}
          />
        </AdminDetailOverlay>
      ) : null}
    </AdminPageShell>
  );
}

export function AdminTaskModerationPage() {
  const [items, setItems] = useState<AdminTask[]>(adminTasks);
  const [active, setActive] = useState<"all" | AdminTaskStatus>("all");
  const [selected, setSelected] = useState<AdminTask | null>(null);
  const visible = active === "all" ? items : items.filter((item) => item.status === active);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        const tasks = await adminService.getAdminTaskDirectory({ limit: 50, offset: 0 });
        if (isMounted) {
          setItems(tasks.map(mapAdminTaskDirectoryItem));
        }
      } catch {
        // Keep the existing mock data if the API is unavailable or the admin is not authenticated.
      }
    }

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  async function moderateTask(id: string, status: "published" | "needs_changes" | "rejected", comment?: string) {
    try {
      const updated = mapAdminTaskDetail(await adminService.moderateAdminTask(id, { comment, target_status: status }));
      setItems((current) => current.map((item) => item.id === id ? updated : item));
      setSelected(null);
    } catch {
      // Do not fake moderation state locally: status/comment must come from backend.
    }
  }

  async function openTask(task: AdminTask) {
    try {
      setSelected(mapAdminTaskDetail(await adminService.getAdminTask(task.id)));
    } catch {
      setSelected(task);
    }
  }

  return (
    <AdminPageShell eyebrow="Модерация заданий" title="Проверка публикаций" description="Оцените описание, сроки, контакты после принятия, требования и количество часов перед публикацией задания.">
      <TaskFilters active={active} onChange={setActive} />
      <section className="grid gap-4 xl:grid-cols-2">
        {visible.map((task) => <TaskModerationCard key={task.id} task={task} onOpen={(item) => void openTask(item)} />)}
      </section>
      {selected ? (
        <AdminDetailOverlay
          eyebrow="Модерация задания"
          title={selected.title}
          onClose={() => setSelected(null)}
          description={`${selected.foundation}. ${selected.category}, ${selected.format}, ${selected.hours} ч. Комментарий при доработке увидит фонд.`}
        >
          <TaskReviewPanel
            task={selected}
            onApprove={() => void moderateTask(selected.id, "published")}
            onRevision={(comment) => void moderateTask(selected.id, "needs_changes", comment)}
            onReject={(comment) => void moderateTask(selected.id, "rejected", comment)}
          />
        </AdminDetailOverlay>
      ) : null}
    </AdminPageShell>
  );
}

function FoundationModerationCard({ foundation, onOpen }: { foundation: AdminFoundation; onOpen: (foundation: AdminFoundation) => void }) {
  const status = foundationStatusConfig[foundation.status];
  return (
    <article className="relative overflow-hidden rounded-[1.65rem] bg-white p-5 shadow-[0_22px_64px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_72px_rgba(34,28,8,0.075)]">
      <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-brand/14 blur-3xl" />
      <div className="relative grid gap-4 md:grid-cols-[84px_1fr] md:items-start">
        <div className="relative size-20 overflow-hidden rounded-[1.35rem] bg-[#fffdf7] shadow-[0_14px_34px_rgba(34,28,8,0.07)]">
          <img src={foundation.logo} alt={foundation.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
            <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/52">{foundation.documents.length} документа</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffdf7] px-3 py-1.5 text-xs font-black text-black/52"><MapPin className="size-3.5" />{foundation.region}</span>
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight">{foundation.name}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-black/52">{foundation.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {foundation.categories.map((item) => <span key={item} className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/54">{item}</span>)}
          </div>
        </div>
      </div>
      <div className="relative mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Контактное лицо" value={`${foundation.contactName}, ${foundation.contactRole}`} />
        <Info label="ИНН / ОГРН" value={`${foundation.inn} / ${foundation.ogrn}`} />
        <Info label="Регистрация" value={foundation.registeredAt} />
      </div>
      <div className="relative mt-4 grid gap-3 md:grid-cols-2">
        <ContactLine icon={Mail} value={foundation.email} />
        <ContactLine icon={Phone} value={foundation.phone} />
      </div>
      {foundation.adminComment ? <p className="mt-4 rounded-[1.15rem] bg-[#fff9ee] px-4 py-3 text-sm font-bold leading-6 text-[#9b5a00]">{foundation.adminComment}</p> : null}
      <button onClick={() => onOpen(foundation)} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black transition hover:-translate-y-0.5">
        Открыть фонд
        <ArrowRight className="size-4" />
      </button>
    </article>
  );
}

function TaskModerationCard({ task, onOpen }: { task: AdminTask; onOpen: (task: AdminTask) => void }) {
  const status = taskStatusConfig[task.status];
  return (
    <article className="overflow-hidden rounded-[1.65rem] bg-white shadow-[0_22px_64px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_72px_rgba(34,28,8,0.075)]">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <div className="relative min-h-[230px] overflow-hidden bg-[#fffdf7]">
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 hover:scale-[1.03]" style={{ backgroundImage: `url('${task.image}')` }} role="img" aria-label={task.title} />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
            {task.proBono ? <AdminStatusBadge tone="done">Pro bono</AdminStatusBadge> : null}
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-black text-black/42">{task.foundation} · {task.category}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">{task.title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-black/52">{task.description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Info label="Формат" value={task.format} />
            <Info label="Дедлайн" value={task.deadline} />
            <Info label="Места" value={`${task.filled}/${task.spots}`} />
            <Info label="Период" value={task.period} />
            <Info label="Город" value={task.city} />
            <Info label="Часы" value={`${task.hours} ч`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {task.requirements.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#fffdf7] px-3 py-1.5 text-xs font-black text-black/54">{item}</span>)}
          </div>
          {task.moderatorComment ? <p className="mt-4 rounded-[1.15rem] bg-[#fff9ee] px-4 py-3 text-sm font-bold leading-6 text-[#9b5a00]">{task.moderatorComment}</p> : null}
          <button onClick={() => onOpen(task)} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black transition hover:-translate-y-0.5">
            Открыть детали
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function FoundationFilters({ active, onChange }: { active: "all" | AdminFoundationStatus; onChange: (value: "all" | AdminFoundationStatus) => void }) {
  const items: { label: string; value: "all" | AdminFoundationStatus }[] = [
    { label: "Все", value: "all" },
    { label: "На проверке", value: "pending" },
    { label: "Одобрено", value: "approved" },
    { label: "На доработке", value: "revision" },
    { label: "Отклонено", value: "rejected" }
  ];
  return <FilterBar items={items} active={active} onChange={onChange} />;
}

function TaskFilters({ active, onChange }: { active: "all" | AdminTaskStatus; onChange: (value: "all" | AdminTaskStatus) => void }) {
  const items: { label: string; value: "all" | AdminTaskStatus }[] = [
    { label: "Все", value: "all" },
    { label: "На модерации", value: "moderation" },
    { label: "Опубликовано", value: "published" },
    { label: "На доработке", value: "returned" },
    { label: "Отклонено", value: "rejected" },
    { label: "Завершено", value: "completed" }
  ];
  return <FilterBar items={items} active={active} onChange={onChange} />;
}

function FilterBar<T extends string>({ items, active, onChange }: { items: { label: string; value: T }[]; active: T; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[1.45rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      {items.map((item) => (
        <button key={item.value} onClick={() => onChange(item.value)} className={cn("h-10 rounded-xl px-4 text-sm font-black transition", active === item.value ? "bg-brand text-black shadow-[0_12px_24px_rgba(255,227,0,0.2)]" : "bg-[#faf9f4] text-black/58 hover:bg-brand/12 hover:text-black")}>{item.label}</button>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] bg-[#fffdf7] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-black/68">{value}</p>
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.15rem] bg-[#fffdf7] px-4 py-3 text-sm font-black text-black/62">
      <Icon className="size-4" />
      {value}
    </div>
  );
}
