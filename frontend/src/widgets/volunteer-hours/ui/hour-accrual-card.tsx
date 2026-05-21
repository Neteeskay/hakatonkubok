import { CalendarDays } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { statusView, type HourStatus } from "@/widgets/volunteer-hours/volunteer-hours-data";

type HourAccrual = {
  id: string;
  task: string;
  foundation: string;
  date: string;
  status: HourStatus;
  statusLabel: string;
  description: string;
  hours: number;
};

export function HourAccrualCard({ item }: { item: HourAccrual }) {
  const status = statusView[item.status];
  const Icon = status.icon;

  return (
    <article className="group grid gap-4 rounded-[1.25rem] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(34,28,8,0.07)] md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 gap-4">
        <span className={cn("mt-1 grid size-10 shrink-0 place-items-center rounded-2xl", status.className)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black leading-tight text-black">{item.task}</h3>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black", status.className)}>
              <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
              {item.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-black/48">{item.foundation}</p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/56">{item.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-black/44">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {item.date}
            </span>
          </div>
        </div>
      </div>
      <div className={cn("rounded-[1.1rem] px-5 py-4 text-center", item.hours > 0 ? "bg-[#e8f8eb] text-[#247a31]" : "bg-[#f7f7f2] text-black/42")}>
        <p className="text-2xl font-black">{item.hours > 0 ? `${item.hours} ч` : "—"}</p>
        <p className="mt-1 text-[11px] font-black">{item.hours > 0 ? "к начислению" : "не начислено"}</p>
      </div>
    </article>
  );
}
