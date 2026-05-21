import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SkillChip({ label, onRemove, tone = "neutral" }: { label: string; onRemove?: () => void; tone?: "neutral" | "brand" | "violet" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1 text-xs font-black transition",
        tone === "neutral" && "bg-[#f4f3ee] text-black/64",
        tone === "brand" && "bg-brand/20 text-black",
        tone === "violet" && "bg-[#eee9ff] text-[#6b4de6]"
      )}
    >
      {label}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="grid size-5 place-items-center rounded-full bg-white/70 text-black/50 transition hover:bg-white hover:text-black" aria-label={`Удалить ${label}`}>
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
