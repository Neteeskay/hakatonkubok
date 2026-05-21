import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

export function ProfileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.45rem] bg-white p-5 shadow-[0_18px_60px_rgba(34,28,8,0.07),inset_0_0_0_1px_rgba(24,20,7,0.06)]", className)}>
      {children}
    </section>
  );
}

export function ProfileSectionTitle({ title, action, actionHref }: { title: string; action?: string; actionHref?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-xl font-black">{title}</h2>
      {action && actionHref ? (
        <Link href={actionHref} className="text-sm font-bold text-black/58 transition hover:text-black">{action}</Link>
      ) : action ? (
        <span className="text-sm font-bold text-black/42">{action}</span>
      ) : null}
    </div>
  );
}

export function SoftBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" | "green" | "violet" | "red" }) {
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

export function RoundIcon({ icon: Icon, tone = "gold" }: { icon: LucideIcon; tone?: "gold" | "dark" | "green" | "violet" }) {
  return (
    <span
      className={cn(
        "grid size-12 place-items-center rounded-2xl",
        tone === "gold" && "bg-brand text-black shadow-[0_12px_26px_rgba(255,227,0,0.24)]",
        tone === "dark" && "bg-[#171717] text-brand",
        tone === "green" && "bg-[#e8f8e8] text-[#247a31]",
        tone === "violet" && "bg-[#eee8ff] text-[#6b4de6]"
      )}
    >
      <Icon className="size-6" />
    </span>
  );
}
