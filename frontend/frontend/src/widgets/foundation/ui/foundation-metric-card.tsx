import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { foundationToneStyles, type FoundationTone } from "@/widgets/foundation/foundation-data";

export function FoundationMetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: LucideIcon; tone: FoundationTone }) {
  const styles = foundationToneStyles[tone];

  return (
    <article className={cn("rounded-[1.2rem] p-5", styles.surface)}>
      <div className="flex items-center gap-4">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", styles.icon)}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-3xl font-black leading-none">{value}</p>
          <p className="mt-1 text-xs font-black leading-4 text-black/62">{label}</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-black text-black/42">{helper}</p>
    </article>
  );
}
