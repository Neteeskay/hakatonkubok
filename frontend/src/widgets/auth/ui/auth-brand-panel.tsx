"use client";

import { Sparkles } from "lucide-react";
import { AuthModeTabs } from "@/widgets/auth/ui/auth-mode-tabs";
import type { AuthMode } from "@/widgets/auth/model/auth-types";
import { Logo } from "@/widgets/navigation/logo";

export function AuthBrandPanel({ mode, onModeChange }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void }) {
  return (
    <section className="relative flex min-h-[720px] overflow-hidden rounded-[2.1rem] bg-white p-7 shadow-[0_28px_100px_rgba(34,28,8,0.11),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-9">
      <div className="absolute -left-28 top-16 size-80 rounded-full bg-brand/28 blur-3xl" />
      <div className="absolute -right-32 top-20 size-[26rem] rounded-full bg-brand/20/70 blur-3xl" />
      <div className="absolute bottom-[-9rem] right-[-6rem] size-[28rem] rounded-full bg-brand/42 blur-2xl" />
      <div className="absolute left-10 top-40 size-40 rounded-full border border-brand/40" />
      <div className="absolute right-16 top-24 size-24 rounded-full bg-brand shadow-[inset_-18px_-20px_42px_rgba(174,107,0,0.18),0_24px_58px_rgba(255,227,0,0.28)]" />
      <div className="absolute right-40 top-56 size-8 rounded-full bg-black/85 shadow-[0_18px_42px_rgba(0,0,0,0.18)]" />
      <div className="absolute bottom-28 left-16 size-12 rounded-full bg-brand shadow-[0_16px_36px_rgba(255,227,0,0.28)]" />
      <div className="absolute right-8 top-1/2 h-px w-[34rem] -rotate-[18deg] bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div className="absolute right-16 top-[38%] h-px w-[28rem] rotate-[24deg] bg-gradient-to-r from-transparent via-black/16 to-transparent" />
      <div className="absolute bottom-16 left-12 h-28 w-44 opacity-60 [background:radial-gradient(circle,rgba(255,209,0,.68)_2px,transparent_3px)] [background-size:18px_18px]" />

      <div className="relative z-10 flex min-h-full w-full flex-col">
        <Logo size="landing" />
        <div className="mt-auto max-w-[560px] pb-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black/54">
            <Sparkles className="size-4 text-brand" />
            Помогать просто
          </p>
          <h1 className="mt-6 text-[54px] font-black leading-[0.92] tracking-normal md:text-[76px]">Вход и регистрация</h1>
          <p className="mt-6 max-w-md text-lg font-medium leading-8 text-black/62">
            Единое пространство для волонтёров, фондов и администраторов Столото.
          </p>

          <div className="mt-8 max-w-[500px]">
            <AuthModeTabs mode={mode} onChange={onModeChange} />
          </div>

        </div>
      </div>
    </section>
  );
}
