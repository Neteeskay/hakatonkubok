import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function FoundationStat({
  icon: Icon,
  label,
  value,
  caption,
  tone = "gold"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tone?: "gold" | "green" | "violet";
}) {
  return (
    <div className="rounded-[1.35rem] bg-white p-5 shadow-[0_16px_54px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <div className="flex items-center justify-between gap-4">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-2xl",
            tone === "gold" && "bg-brand text-black shadow-[0_14px_28px_rgba(255,227,0,0.22)]",
            tone === "green" && "bg-[#e8f8e8] text-[#247a31]",
            tone === "violet" && "bg-[#eee8ff] text-[#6b4de6]"
          )}
        >
          <Icon className="size-5" />
        </span>
        <p className="rounded-full bg-brand/12 px-3 py-1 text-xs font-black text-black/58">{label}</p>
      </div>
      <p className="mt-5 text-4xl font-black leading-none">{value}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-black/52">{caption}</p>
    </div>
  );
}
