import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Calendar, Clock, MapPin, UsersRound, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { cn } from "@/shared/lib/utils";
import { getRecruitmentState, recruitmentToneClass } from "@/widgets/volunteer-feed/model/recruitment-state";
import { categoryLabels, formatLabels, taskVisuals } from "@/widgets/volunteer-feed/task-dictionaries";
import { TaskMiniBadge, VolunteerAvatars } from "@/widgets/volunteer-feed/ui/task-card-parts";

export function FoundationActivityCard({ task, compact = false }: { task: VolunteerTask; compact?: boolean }) {
  const visual = taskVisuals[task.id] ?? taskVisuals["task-001"];
  const recruitment = getRecruitmentState(task);

  return (
    <article className="group overflow-hidden rounded-[1.25rem] bg-white shadow-[0_16px_54px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(255,227,0,0.42)]">
      <div className={cn("grid gap-0", compact ? "md:grid-cols-[170px_1fr]" : "md:grid-cols-[240px_1fr]")}>
        <Link
          href={`/volunteer/tasks/${task.id}`}
          className={cn("relative min-h-44 overflow-hidden bg-gradient-to-br", compact ? "md:min-h-full" : "md:min-h-[220px]", visual.tone)}
          aria-label={`Открыть задание ${task.title}`}
        >
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.035]" style={{ backgroundImage: `url('${visual.image}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-white/8" />
          <TaskMiniBadge className="absolute left-3 top-3 bg-brand text-black shadow-[0_10px_22px_rgba(255,227,0,0.26)]">{visual.badge}</TaskMiniBadge>
          <TaskMiniBadge className="absolute bottom-3 left-3 bg-white/90 text-black backdrop-blur">{formatLabels[task.format]}</TaskMiniBadge>
        </Link>

        <div className="flex min-w-0 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-black/45">
            <span>{categoryLabels[task.category]}</span>
            <span className="size-1 rounded-full bg-black/18" />
            <span>{task.proBono ? "Pro bono" : "Волонтёрская активность"}</span>
          </div>
          <Link href={`/volunteer/tasks/${task.id}`} className="mt-2 max-w-[520px] text-xl font-black leading-tight transition group-hover:text-black/72">
            {task.title}
          </Link>
          <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-black/58">{task.description}</p>

          <div className="mt-4 grid gap-x-4 gap-y-2 text-sm font-bold text-black/58 sm:grid-cols-2">
            <Meta icon={MapPin}>{task.city}</Meta>
            <Meta icon={Calendar}>{task.date}</Meta>
            <Meta icon={Clock}>{task.hours} часов</Meta>
            <Meta icon={UsersRound}>{task.filled} из {task.spots} участников</Meta>
          </div>

          <div className="mt-auto pt-5">
            <div className="flex items-center gap-3">
              <VolunteerAvatars count={task.filled} />
              <TaskMiniBadge className={recruitmentToneClass(recruitment.tone)}>{recruitment.label}</TaskMiniBadge>
              <Link
                href={`/volunteer/tasks/${task.id}`}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black shadow-[0_12px_26px_rgba(255,227,0,0.24)] transition hover:-translate-y-0.5"
              >
                Подробнее
                <ArrowRight className="size-4" />
              </Link>
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
      <Icon className="size-4 shrink-0 text-black/48" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
