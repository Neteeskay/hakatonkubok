import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { historyToneStyles, type HistoryTone } from "@/widgets/volunteer-activity/history-data";

export function HistorySummaryCard({ value, label, helper, tone, icon: Icon }: { value: string; label: string; helper: string; tone: HistoryTone; icon: LucideIcon }) {
  const styles = historyToneStyles[tone];

  return (
    <article className={cn("rounded-[1.15rem] p-5", styles.surface)}>
      <div className="flex items-center gap-4">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", styles.icon)}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-3xl font-black leading-none">{value}</p>
          <p className="mt-1 text-xs font-black leading-4 text-black/64">{label}</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-black text-black/42">{helper}</p>
    </article>
  );
}
