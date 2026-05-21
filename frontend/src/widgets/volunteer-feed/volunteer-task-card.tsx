"use client";

import type { ReactNode } from "react";
import { Calendar, Clock, FileText, Heart, Link2, MapPin, Repeat, UsersRound, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { commitmentLabels, formatLabels, getCategoryLabel, getSkillLabel, getTaskVisual } from "@/widgets/volunteer-feed/task-dictionaries";
import { getRecruitmentState, recruitmentToneClass } from "@/widgets/volunteer-feed/model/recruitment-state";
import { TaskMiniBadge, VolunteerAvatars } from "@/widgets/volunteer-feed/ui/task-card-parts";
import { cn } from "@/shared/lib/utils";

export function VolunteerTaskCard({ task, onOpen }: { task: VolunteerTask; onOpen: (task: VolunteerTask) => void }) {
  const visual = getTaskVisual(task.id, task.imageUrl);
  const recruitment = getRecruitmentState(task);

  return (
    <article className="group overflow-hidden rounded-[1.15rem] bg-white shadow-[0_14px_42px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(34,28,8,0.11),inset_0_0_0_1px_rgba(255,227,0,0.5)]">
      <div className="grid min-h-[236px] gap-0 md:grid-cols-[250px_1fr]">
        <button
          type="button"
          onClick={() => onOpen(task)}
          className={cn("relative min-h-[218px] overflow-hidden rounded-[1.15rem] bg-gradient-to-br text-left md:m-3 md:min-h-0", visual.tone)}
          aria-label={`Открыть задание ${task.title}`}
        >
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.035]" style={{ backgroundImage: `url('${visual.image}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/26 via-transparent to-white/6" />
          <TaskMiniBadge className="absolute left-3 top-3 bg-brand text-black shadow-[0_10px_22px_rgba(255,227,0,0.26)]">{visual.badge}</TaskMiniBadge>
          <TaskMiniBadge className="absolute bottom-3 left-3 bg-white/88 text-black backdrop-blur">{formatLabels[task.format]}</TaskMiniBadge>
        </button>

        <div className="flex min-w-0 flex-col px-5 py-5 md:pl-2 md:pr-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-black/50">
                <span>{getCategoryLabel(task.category)}</span>
                <span className="size-1 rounded-full bg-black/20" />
                <span>{task.foundation}</span>
              </div>
              <button onClick={() => onOpen(task)} className="mt-2 block max-w-[430px] text-left text-xl font-black leading-[1.05] tracking-normal text-black transition group-hover:text-black/76">
                {task.title}
              </button>
            </div>
            <button className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black/34 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.12)] transition hover:bg-brand/12 hover:text-black" aria-label="Добавить в избранное">
              <Heart className="size-5" />
            </button>
          </div>

          <p className="mt-3 line-clamp-3 max-w-[470px] text-sm font-medium leading-6 text-black/62">{task.description}</p>

          <div className="mt-4 grid gap-x-5 gap-y-2 text-sm font-bold text-black/60 sm:grid-cols-2">
            <Meta icon={MapPin}>{task.city}{task.format === "online" ? "" : `, ${task.location}`}</Meta>
            <Meta icon={Calendar}>{task.date} · {task.deadline}</Meta>
            <Meta icon={Clock}>{task.hours} часов</Meta>
            <Meta icon={UsersRound}>{task.filled} из {task.spots} участников</Meta>
            <Meta icon={Repeat}>{commitmentLabels[task.commitment]}</Meta>
            <Meta icon={Link2}>{task.format === "online" ? "Ссылка после принятия" : "Место после отклика"}</Meta>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <TaskMiniBadge className={recruitmentToneClass(recruitment.tone)}>{recruitment.label}</TaskMiniBadge>
            <TaskMiniBadge className="bg-[#f4f3ee] text-black/58">{recruitment.helper}</TaskMiniBadge>
            {task.proBono ? <TaskMiniBadge className="bg-[#eee8ff] text-[#6b4de6]">Pro bono</TaskMiniBadge> : null}
            {task.skills.slice(0, 2).map((skill) => <TaskMiniBadge key={skill} className="bg-brand/12 text-black/62">{getSkillLabel(skill)}</TaskMiniBadge>)}
            <TaskMiniBadge className="bg-[#f4f3ee] text-black/58"><FileText className="mr-1 size-3" />материалы</TaskMiniBadge>
          </div>

          <div className="mt-auto pt-5">
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#efeee8]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${recruitment.progress}%` }} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <VolunteerAvatars count={task.filled} />
              <span className="mr-auto text-xs font-bold text-black/52">{task.filled} из {task.spots} участников</span>
              <button onClick={() => onOpen(task)} className="h-10 shrink-0 rounded-xl bg-brand px-5 text-sm font-black text-black shadow-[0_12px_26px_rgba(255,227,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-95">
                Откликнуться
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-black/56" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
