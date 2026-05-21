import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { adminToneStyles, type AdminTone } from "@/widgets/admin/admin-data";

export function AdminKpiCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: LucideIcon; tone: AdminTone }) {
  return (
    <article className="group rounded-[1.45rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(255,227,0,0.32)]">
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid size-12 place-items-center rounded-2xl", adminToneStyles[tone].icon)}>
          <Icon className="size-5" />
        </span>
        <span className="rounded-full bg-[#fffdf7] px-2.5 py-1 text-[11px] font-black text-black/42">live</span>
      </div>
      <p className="mt-5 text-3xl font-black leading-none">{value}</p>
      <h3 className="mt-2 text-sm font-black text-black/72">{label}</h3>
      <p className="mt-2 text-xs font-bold leading-5 text-black/44">{helper}</p>
    </article>
  );
}
