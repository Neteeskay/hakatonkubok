"use client";

import { MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { historyStatusConfig, historyToneStyles, type VolunteerHistoryEntry } from "@/widgets/volunteer-activity/history-data";
import { getTaskVisual } from "@/widgets/volunteer-feed/task-dictionaries";

export function HistoryTimelineItem({ entry, onOpen }: { entry: VolunteerHistoryEntry; onOpen: (entry: VolunteerHistoryEntry) => void }) {
  const status = historyStatusConfig[entry.status];
  const styles = historyToneStyles[status.tone];
  const Icon = status.icon;
  const visual = getTaskVisual(entry.task.id, entry.task.imageUrl);
  const hoursAwarded = entry.status === "hours";

  return (
    <button
      onClick={() => onOpen(entry)}
      className="group relative grid w-full gap-4 py-3 pl-[96px] text-left md:grid-cols-[160px_1fr_150px] md:items-center"
      aria-label={`Открыть историю участия ${entry.task.title}`}
    >
      <div className="absolute left-0 top-4 w-[76px] text-sm font-bold leading-5 text-black/64">
        <span className="block">{entry.date}</span>
        <span className="block">{entry.year}</span>
      </div>
      <span className={cn("absolute left-[61px] top-4 z-10 grid size-6 place-items-center rounded-full text-white shadow-[0_0_0_6px_white]", styles.dot)}>
        <Icon className="size-3.5" />
      </span>

      <div className="relative h-[116px] overflow-hidden rounded-[1.05rem]">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url('${visual.image}')` }} />
      </div>

      <div className="min-w-0">
        <span className={cn("inline-flex rounded-lg px-3 py-1.5 text-xs font-black", styles.icon)}>{status.label}</span>
        <h2 className="mt-3 text-lg font-black leading-6 transition group-hover:text-black/72">{entry.task.title}</h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold text-black/52">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />{entry.task.foundation}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{entry.task.city}</span>
          <span>{entry.formatLabel}</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-black/56">{entry.description}</p>
      </div>

      <div className={cn("rounded-[1rem] p-4 text-left md:text-center", hoursAwarded ? "bg-[#f0fbf1]" : styles.surface)}>
        <p className="text-2xl font-black leading-none">{entry.hours ? `${entry.hours} ч` : "—"}</p>
        <p className="mt-2 text-xs font-black text-black/48">{entry.hours ? (hoursAwarded ? "начислено" : "на проверке") : "часы не начислены"}</p>
        <p className={cn("mt-3 text-[11px] font-black leading-4", styles.text)}>{status.helper}</p>
        <p className="mt-3 text-[11px] font-bold leading-4 text-black/42">{entry.confirmedAt ?? "Ожидает начисления часов"}</p>
      </div>
    </button>
  );
}
