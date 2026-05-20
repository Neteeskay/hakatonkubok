"use client";

import type { ReactNode } from "react";
import { Calendar, Clock, Heart, Link2, MapPin, Repeat, UsersRound, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { categoryLabels, commitmentLabels, formatLabels, skillLabels, taskStatusLabels, taskVisuals } from "@/widgets/volunteer-feed/task-dictionaries";
import { cn } from "@/shared/lib/utils";

export function VolunteerTaskCard({ task, onOpen }: { task: VolunteerTask; onOpen: (task: VolunteerTask) => void }) {
  const visual = taskVisuals[task.id] ?? taskVisuals["task-001"];
  const participantsLeft = task.spots - task.filled;

  return (
    <article className="group grid overflow-hidden rounded-[1.35rem] bg-white shadow-[0_16px_55px_rgba(34,28,8,0.07),inset_0_0_0_1px_rgba(34,28,8,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_75px_rgba(34,28,8,0.12),inset_0_0_0_1px_rgba(255,204,0,0.52)] md:grid-cols-[240px_1fr]">
      <button
        type="button"
        onClick={() => onOpen(task)}
        className={cn("relative min-h-[220px] overflow-hidden bg-gradient-to-br text-left md:min-h-full", visual.tone)}
        aria-label={`Открыть задание ${task.title}`}
      >
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url('${visual.image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-white/10" />
        <span className="absolute left-4 top-4 rounded-lg bg-brand px-3 py-1.5 text-xs font-black text-black shadow-[0_10px_24px_rgba(255,204,0,0.3)]">{visual.badge}</span>
        <span className="absolute bottom-4 left-4 rounded-full bg-white/86 px-3 py-1.5 text-xs font-black text-black backdrop-blur">{formatLabels[task.format]}</span>
      </button>

      <div className="flex min-w-0 flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-black/50">
              <span>{categoryLabels[task.category]}</span>
              <span className="size-1 rounded-full bg-black/20" />
              <span>{task.foundation}</span>
            </div>
            <button type="button" onClick={() => onOpen(task)} className="mt-2 block text-left text-xl font-black leading-tight transition group-hover:text-black/78">
              {task.title}
            </button>
          </div>
          <button className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black/46 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-[#fff8d7] hover:text-black" aria-label="Добавить в избранное">
            <Heart className="size-4" />
          </button>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-black/62">{task.description}</p>

        <div className="mt-4 grid gap-2 text-sm text-black/62 sm:grid-cols-2">
          <Meta icon={MapPin}>{task.city} · {task.location}</Meta>
          <Meta icon={Calendar}>{task.date} · дедлайн {task.deadline}</Meta>
          <Meta icon={Repeat}>{commitmentLabels[task.commitment]}</Meta>
          <Meta icon={Clock}>{task.hours} волонтёрских часа</Meta>
          <Meta icon={UsersRound}>{task.filled} откликнулись · {participantsLeft} мест осталось</Meta>
          <Meta icon={Link2}>{task.format === "online" ? "Ссылка после принятия" : "Точка встречи после принятия"}</Meta>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {task.proBono ? <span className="rounded-full bg-[#fff1a8] px-3 py-1.5 text-xs font-black text-black">Pro bono</span> : null}
          <span className="rounded-full bg-[#f2f1ec] px-3 py-1.5 text-xs font-bold text-black/62">{taskStatusLabels[task.status]}</span>
          {task.skills.map((skill) => <span key={skill} className="rounded-full bg-[#f8f6ef] px-3 py-1.5 text-xs font-bold text-black/58">{skillLabels[skill]}</span>)}
        </div>

        <div className="mt-4 grid gap-3 border-t border-black/6 pt-4 text-xs leading-5 text-black/58 lg:grid-cols-2">
          <p><strong className="text-black">Требования:</strong> {task.requirements.slice(0, 2).join("; ")}</p>
          <p><strong className="text-black">Инструкции:</strong> {task.instructions.slice(0, 2).join("; ")}</p>
          <p><strong className="text-black">Материалы:</strong> бренд-пакет / чек-лист после принятия</p>
          <p><strong className="text-black">Результат:</strong> {task.impact}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {["АС", "ПИ", "ДН", "МК"].map((initial) => (
              <span key={initial} className="grid size-7 place-items-center rounded-full bg-[#fff7c7] text-[10px] font-black text-black ring-2 ring-white">{initial}</span>
            ))}
            <span className="grid size-7 place-items-center rounded-full bg-white text-[10px] font-black text-black/48 ring-2 ring-white">+{task.filled}</span>
          </div>
          <button onClick={() => onOpen(task)} className="rounded-xl bg-brand px-5 py-3 text-sm font-black text-black shadow-[0_12px_28px_rgba(255,204,0,0.28)] transition hover:-translate-y-0.5">
            Откликнуться
          </button>
        </div>
      </div>
    </article>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-black/58" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
