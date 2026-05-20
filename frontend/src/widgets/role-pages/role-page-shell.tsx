import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function RoleHero({
  eyebrow,
  title,
  description,
  image,
  action,
  tone = "light"
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  action?: string;
  tone?: "light" | "dark" | "gold";
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] p-6 shadow-[0_28px_90px_rgba(66,50,0,0.1)] md:p-8",
        tone === "dark" && "bg-white text-black",
        tone === "gold" && "gold-panel text-black",
        tone === "light" && "premium-surface"
      )}
    >
      {image ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-95" style={{ backgroundImage: `url('${image}')` }} />
          <div className={cn("absolute inset-0", tone === "dark" ? "bg-gradient-to-r from-black via-black/70 to-black/8" : "bg-gradient-to-r from-white/94 via-white/72 to-white/12")} />
        </div>
      ) : null}
      <div className="relative max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-black/48">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.94] md:text-6xl">{title}</h1>
        <div className="mt-4 h-1 w-12 rounded-full bg-brand" />
        <p className="mt-6 max-w-xl text-base leading-7 text-black/68 md:text-lg">{description}</p>
        {action ? (
          <button className="mt-7 inline-flex h-12 items-center gap-3 rounded-2xl bg-brand px-5 text-sm font-black text-black shadow-[0_18px_42px_rgba(255,199,0,0.32)] transition hover:-translate-y-0.5">
            {action}
            <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function MetricStrip({ items }: { items: { icon: LucideIcon; value: string; label: string }[] }) {
  return (
    <section className="grid gap-4 rounded-[1.55rem] bg-white p-5 text-black shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className={cn("flex items-center gap-4 px-2", index > 0 && "md:border-l md:border-black/8 md:pl-7")}>
          <item.icon className="size-8 text-brand" />
          <div>
            <p className="text-2xl font-black">{item.value}</p>
            <p className="text-sm text-black/56">{item.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ProductPanel({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("premium-surface rounded-[1.7rem] p-5 md:p-6", className)}>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "black" | "green" | "blue" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-xs font-black",
        tone === "gold" && "bg-brand text-black",
        tone === "black" && "bg-brand text-black",
        tone === "green" && "bg-emerald-100 text-emerald-800",
        tone === "blue" && "bg-sky-100 text-sky-800",
        tone === "muted" && "bg-black/6 text-black/58"
      )}
    >
      {children}
    </span>
  );
}

export function EditorialList({ items }: { items: { title: string; meta: string; text: string; status?: string }[] }) {
  return (
    <div className="divide-y divide-black/8 overflow-hidden rounded-[1.35rem] bg-white/60">
      {items.map((item) => (
        <article key={item.title} className="grid gap-3 p-4 transition hover:bg-white md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{item.meta}</p>
            <h3 className="mt-1 text-lg font-black">{item.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">{item.text}</p>
          </div>
          {item.status ? <StatusPill tone="muted">{item.status}</StatusPill> : null}
        </article>
      ))}
    </div>
  );
}
