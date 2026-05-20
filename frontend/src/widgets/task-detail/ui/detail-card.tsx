import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function DetailCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.45rem] bg-white p-5 shadow-[0_18px_60px_rgba(34,28,8,0.07),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-6", className)}>
      {children}
    </section>
  );
}

export function DetailTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      {action}
    </div>
  );
}

export function InfoTile({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-[1.2rem] bg-[#fffdf7] p-4", accent && "bg-brand/12")}>
      <Icon className="size-5 text-brand" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-black/74">{value}</p>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "green" | "violet" | "red" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-black",
        tone === "neutral" && "bg-[#f4f3ee] text-black/62",
        tone === "gold" && "bg-brand/20 text-black",
        tone === "green" && "bg-[#e8f8e8] text-[#247a31]",
        tone === "violet" && "bg-[#eee8ff] text-[#6b4de6]",
        tone === "red" && "bg-[#ffe8e8] text-[#d94747]"
      )}
    >
      {children}
    </span>
  );
}

export function IconBubble({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-black shadow-[0_12px_26px_rgba(255,227,0,0.24)]", className)}>
      <Icon className="size-5" />
    </span>
  );
}
