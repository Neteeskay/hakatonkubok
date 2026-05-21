"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export function AdminDetailOverlay({
  eyebrow,
  title,
  description,
  onClose,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/18 p-3 backdrop-blur-sm md:p-6">
      <section className="mx-auto min-h-full max-w-[1180px] overflow-hidden rounded-[1.8rem] bg-white shadow-[0_32px_120px_rgba(34,28,8,0.22)]">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 bg-white/92 p-5 backdrop-blur-xl md:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/36">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-black md:text-4xl">{title}</h2>
            {description ? <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-black/52">{description}</p> : null}
          </div>
          <button onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fffdf7] text-black/62 transition hover:bg-brand/16 hover:text-black" aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </header>
        <div className="p-5 pt-0 md:p-7 md:pt-0">{children}</div>
      </section>
    </div>
  );
}
