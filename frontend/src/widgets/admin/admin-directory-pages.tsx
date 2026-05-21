"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { adminFoundations, adminTasks, foundationStatusConfig, taskStatusConfig, type AdminTask, type AdminTaskStatus } from "@/widgets/admin/admin-data";
import { AdminDetailOverlay } from "@/widgets/admin/ui/admin-detail-overlay";
import { AdminPageShell } from "@/widgets/admin/ui/admin-page-shell";
import { TaskReviewPanel } from "@/widgets/admin/ui/admin-review-panels";
import { AdminStatusBadge } from "@/widgets/admin/ui/admin-status-badge";

export function AdminFoundationsPage() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => adminFoundations.filter((item) => `${item.name} ${item.region} ${item.categories.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <AdminPageShell eyebrow="Фонды" title="Реестр организаций" description="Все фонды платформы: статус проверки, активность, задания, волонтёры и часы.">
      <SearchInput value={query} onChange={setQuery} placeholder="Искать фонд, регион или категорию" />
      <section className="grid gap-4 xl:grid-cols-2">
        {visible.map((foundation) => {
          const status = foundationStatusConfig[foundation.status];
          return (
            <article key={foundation.id} className="rounded-[1.6rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
              <div className="grid gap-4 md:grid-cols-[80px_1fr]">
                <div className="relative size-20 overflow-hidden rounded-[1.35rem] bg-[#fffdf7]">
                  <Image src={foundation.logo} alt={foundation.name} fill sizes="80px" className="object-cover" />
                </div>
                <div>
                  <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
                  <h2 className="mt-3 text-2xl font-black leading-tight">{foundation.name}</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-black/52">{foundation.description}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <MiniMetric value={foundation.activeTasks.toString()} label="заданий" />
                <MiniMetric value={`${foundation.volunteers}`} label="волонтёров" />
                <MiniMetric value={`${foundation.hours}`} label="часов" />
                <MiniMetric value={foundation.region} label="регион" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {foundation.categories.map((item) => <span key={item} className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/54">{item}</span>)}
              </div>
            </article>
          );
        })}
      </section>
    </AdminPageShell>
  );
}

export function AdminTasksPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminTask[]>(adminTasks);
  const [selected, setSelected] = useState<AdminTask | null>(null);
  const visible = useMemo(() => items.filter((item) => `${item.title} ${item.foundation} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  function updateStatus(id: string, status: AdminTaskStatus, comment?: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status, moderatorComment: comment ?? item.moderatorComment } : item));
    setSelected(null);
  }

  return (
    <AdminPageShell eyebrow="Задания" title="Все активности платформы" description="Опубликованные, завершённые, возвращённые и ожидающие проверки задания в одном рабочем списке.">
      <SearchInput value={query} onChange={setQuery} placeholder="Искать задание, фонд или категорию" />
      <section className="grid gap-4 xl:grid-cols-2">
        {visible.map((task) => {
          const status = taskStatusConfig[task.status];
          return (
            <article key={task.id} className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5">
              <div className="grid md:grid-cols-[220px_1fr]">
                <div className="relative min-h-[210px] bg-[#fffdf7]">
                  <Image src={task.image} alt={task.title} fill sizes="220px" className="object-cover" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
                    {task.proBono ? <AdminStatusBadge tone="done">Pro bono</AdminStatusBadge> : null}
                  </div>
                </div>
                <div className="p-5">
                  <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/52">{task.format}</span>
                  <h2 className="mt-4 text-2xl font-black leading-tight">{task.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-black/52">{task.description}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <MiniMetric value={task.foundation} label="фонд" />
                    <MiniMetric value={task.category} label="категория" />
                    <MiniMetric value={`${task.filled}/${task.spots}`} label="места" />
                    <MiniMetric value={`${task.hours} ч`} label="часы" />
                  </div>
                  <button onClick={() => setSelected(task)} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black transition hover:-translate-y-0.5">
                    Открыть детали
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      {selected ? (
        <AdminDetailOverlay eyebrow="Детали задания" title={selected.title} description="Полная карточка задания и рабочее решение администратора." onClose={() => setSelected(null)}>
          <TaskReviewPanel
            task={selected}
            onApprove={() => updateStatus(selected.id, "published")}
            onRevision={(comment) => updateStatus(selected.id, "returned", comment)}
            onReject={(comment) => updateStatus(selected.id, "rejected", comment)}
          />
        </AdminDetailOverlay>
      ) : null}
    </AdminPageShell>
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

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.1rem] bg-[#fffdf7] p-3">
      <p className="truncate text-sm font-black text-black">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
    </div>
  );
}
