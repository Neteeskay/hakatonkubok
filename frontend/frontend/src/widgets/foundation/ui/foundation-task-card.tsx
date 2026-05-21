"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, PencilLine, RotateCcw, UsersRound } from "lucide-react";
import { foundationToneStyles, taskStatusConfig, type FoundationTaskItem } from "@/widgets/foundation/foundation-data";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";
import { taskVisuals } from "@/widgets/volunteer-feed/task-dictionaries";

export function FoundationTaskCard({ task, compact = false, onEdit }: { task: FoundationTaskItem; compact?: boolean; onEdit?: (task: FoundationTaskItem) => void }) {
  const status = taskStatusConfig[task.status];
  const styles = foundationToneStyles[status.tone];
  const visual = taskVisuals[task.taskId] ?? taskVisuals["task-001"];
  const progress = Math.min(Math.round((task.participants / task.capacity) * 100), 100);
  const needsRevision = task.status === "returned" || task.status === "rejected";

  return (
    <article className="group overflow-hidden rounded-[1.55rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07),0_26px_70px_rgba(34,28,8,0.08)]">
      <div className={compact ? "grid gap-0 lg:grid-cols-[170px_1fr]" : "grid gap-0 xl:grid-cols-[240px_1fr_250px]"}>
        <div className={`relative overflow-hidden ${compact ? "min-h-[155px] lg:m-3 lg:rounded-[1.15rem]" : "min-h-[210px] xl:m-3 xl:rounded-[1.15rem]"}`}>
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url('${visual.image}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/32 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-xl bg-brand px-3 py-1.5 text-[11px] font-black text-black shadow-[0_10px_24px_rgba(0,0,0,0.12)]">{task.category}</span>
          <span className="absolute bottom-3 left-3 rounded-xl bg-white/88 px-3 py-1.5 text-[11px] font-black text-black backdrop-blur">{task.format}</span>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <FoundationStatusBadge tone={status.tone}>{status.label}</FoundationStatusBadge>
            <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-[11px] font-black text-black/52">{status.helper}</span>
          </div>
          <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight">{task.title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-black/56">{task.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-black/52">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{task.city}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{task.period}</span>
            <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4" />{task.responses} откликов · {task.participants}/{task.capacity} участников</span>
          </div>
          {task.moderationComment ? (
            <div className="mt-5 rounded-[1.1rem] bg-[#f7f4ff] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b4de6]">Комментарий администратора</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#6b4de6]">{task.moderationComment}</p>
              {onEdit ? (
                <button onClick={() => onEdit(task)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[#6b4de6] shadow-[inset_0_0_0_1px_rgba(107,77,230,0.16)] transition hover:bg-[#eee9ff]">
                  Исправить задание
                  <ArrowRight className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {!compact ? (
          <aside className="flex flex-col justify-between bg-[#fffdf7] p-5 md:p-6">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Заполнение</p>
                  <p className="mt-2 text-3xl font-black">{progress}%</p>
                </div>
                <p className={`text-sm font-black ${styles.text}`}>{task.hours} ч</p>
              </div>
              <div className="mt-5 h-2.5 rounded-full bg-[#ece8dc]">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold text-black/46">Дедлайн: {task.deadline}</p>
            </div>
            <div className="mt-5 grid gap-2">
              <Link href="/foundation/participants" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-xs font-black text-black transition hover:brightness-95">
                Отклики и участие
                <ArrowRight className="size-4" />
              </Link>
              <button onClick={() => onEdit?.(task)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
                {needsRevision ? <RotateCcw className="size-4" /> : <PencilLine className="size-4" />}
                {needsRevision ? "Доработать" : "Редактировать"}
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
