"use client";

import { Calendar, ChevronDown, CheckCircle2, Clock, MapPin, MessageCircle, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { getTaskVisual } from "@/widgets/volunteer-feed/task-dictionaries";
import type { VolunteerApplicationItem } from "@/widgets/volunteer-activity/activity-data";
import { ApplicationContactPanel } from "@/widgets/volunteer-activity/ui/application-contact-panel";

const stageStyles: Record<VolunteerApplicationItem["stage"], { badge: string; icon: string; iconNode: LucideIcon }> = {
  pending: { badge: "bg-[#e9efff] text-[#315ed1]", icon: "bg-[#e9efff] text-[#315ed1]", iconNode: Clock },
  accepted: { badge: "bg-[#e6f8e9] text-[#247a31]", icon: "bg-[#e6f8e9] text-[#247a31]", iconNode: CheckCircle2 },
  "in-progress": { badge: "bg-[#eee9ff] text-[#6b4de6]", icon: "bg-[#eee9ff] text-[#6b4de6]", iconNode: Calendar },
  completed: { badge: "bg-[#e6f8ef] text-[#237650]", icon: "bg-[#e6f8ef] text-[#237650]", iconNode: CheckCircle2 },
  hours: { badge: "bg-brand/20 text-black", icon: "bg-brand/20 text-black", iconNode: CheckCircle2 },
  rejected: { badge: "bg-[#ffe8e8] text-[#c83c3c]", icon: "bg-[#ffe8e8] text-[#c83c3c]", iconNode: XCircle }
};

export function ApplicationCard({ application, onOpen }: { application: VolunteerApplicationItem; onOpen: (application: VolunteerApplicationItem) => void }) {
  const visual = getTaskVisual(application.task.id, application.task.imageUrl);
  const tone = stageStyles[application.stage];
  const StatusIcon = tone.iconNode;

  return (
    <article className="group rounded-[1.25rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(255,227,0,0.32)]">
      <button
        onClick={() => onOpen(application)}
        className="grid w-full gap-4 p-3 text-left md:grid-cols-[116px_1fr] xl:grid-cols-[132px_1.14fr_0.58fr_0.94fr_138px_28px]"
        aria-label={`Открыть отклик ${application.task.title}`}
      >
        <div className="relative h-[104px] overflow-hidden rounded-[1rem] md:h-[88px] xl:h-[92px]">
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url('${visual.image}')` }} />
          <span className="absolute left-2 top-2 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-black text-black">{application.stage === "pending" ? "Новое" : application.statusLabel}</span>
        </div>

        <div className="min-w-0 py-1">
          <p className="text-[11px] font-black text-black/42">{application.task.foundation}</p>
          <h2 className="mt-1 max-w-[420px] text-base font-black leading-5 text-black transition group-hover:text-black/72 md:text-lg">
            {application.task.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-black/56">
            <Meta icon={MapPin} value={application.task.city} />
            <Meta icon={Calendar} value={application.eventDate} />
            <Meta icon={Clock} value={`${application.task.hours} часа`} />
          </div>
        </div>

        <div className="py-1">
          <span className={cn("inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-black", tone.badge)}>
            {application.statusLabel}
          </span>
          <p className="mt-2 text-xs font-bold leading-5 text-black/52">{application.appliedAt ? `Отклик отправлен ${application.appliedAt}` : application.stageLabel}</p>
        </div>

        <div className="flex gap-3 py-1">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone.icon)}>
            <StatusIcon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black leading-5">{application.title}</span>
            <span className="mt-1 block text-xs font-bold leading-5 text-black/52">{application.nextAction}</span>
          </span>
        </div>

        <div className="flex items-start justify-start gap-2 xl:justify-end">
          <span className="inline-flex h-10 items-center justify-center rounded-xl bg-[#faf9f4] px-4 text-xs font-black text-black/66 transition group-hover:bg-brand group-hover:text-black">
            Подробнее
          </span>
        </div>

        <div className="hidden items-center justify-center xl:flex">
          <ChevronDown className="size-4 text-black/42 transition group-hover:text-black" />
        </div>
      </button>

      <div className="border-t border-black/[0.045] px-3 pb-3 pt-3">
        <ApplicationContactPanel application={application} />
      </div>
    </article>
  );
}

function Meta({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 text-black/42" />
      {value}
    </span>
  );
}
