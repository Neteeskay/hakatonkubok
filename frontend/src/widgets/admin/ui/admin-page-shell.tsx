import type { ReactNode } from "react";
import { Search, Sparkles } from "lucide-react";

export function AdminPageShell({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-6 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-55 lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[64%] bg-gradient-to-r from-white via-white/88 to-white/16 lg:block" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/16 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black/46">
              <Sparkles className="size-4" />
              {eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-black/58">{description}</p>
          </div>
          <div className="space-y-3">
            <div className="flex h-12 items-center gap-3 rounded-full bg-[#fffdf7] px-5 text-sm font-bold text-black/42 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)]">
              Поиск по фондам, заданиям, волонтёрам
              <Search className="ml-auto size-5 text-black" />
            </div>
            {action}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
