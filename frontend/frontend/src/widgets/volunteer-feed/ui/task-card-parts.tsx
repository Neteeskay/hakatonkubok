import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function TaskMiniBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-black", className)}>
      {children}
    </span>
  );
}

export function VolunteerAvatars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {["А", "П", "Д", "М"].map((initial, index) => (
          <span key={`${initial}-${index}`} className="grid size-7 place-items-center rounded-full bg-brand text-[10px] font-black text-black ring-2 ring-white">
            {initial}
          </span>
        ))}
        <span className="grid size-7 place-items-center rounded-full bg-white text-[10px] font-black text-black/48 ring-2 ring-white">+{Math.max(count - 4, 0)}</span>
      </div>
    </div>
  );
}
