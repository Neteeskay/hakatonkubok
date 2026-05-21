"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { authService, getApiErrorMessage, type UserRole } from "@/shared/api";
import { demoRoles } from "@/widgets/auth/model/auth-data";
import { cn } from "@/shared/lib/utils";

const roleRedirects: Record<UserRole, string> = {
  admin: "/admin",
  fund: "/foundation",
  volunteer: "/volunteer"
};

export function DemoLogin() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginDemo(role: (typeof demoRoles)[number]) {
    setLoadingRole(role.title);
    setError(null);
    try {
      const response = await authService.login({ login: role.login, password: role.password });
      router.push(roleRedirects[response.user.role]);
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-brand via-brand to-brand p-5 text-black shadow-[0_24px_70px_rgba(255,227,0,0.27),inset_0_0_0_1px_rgba(255,255,255,0.35)]">
      <div className="absolute -right-12 -top-14 size-40 rounded-full bg-white/42 blur-2xl" />
      <div className="absolute bottom-3 right-6 size-20 rounded-full border border-black/10" />
      <button onClick={() => setOpen((current) => !current)} className="relative flex w-full items-center gap-4 text-left">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-[0_12px_30px_rgba(116,78,0,0.13)]">
          <Play className="size-5 fill-black" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-[0.16em] text-black/48">Попробовать</span>
          <span className="mt-1 block text-2xl font-black leading-none">Demo вход</span>
          <span className="mt-2 block max-w-sm text-sm font-bold leading-5 text-black/62">Нажмите, чтобы выбрать готовый аккаунт волонтёра, фонда или администратора.</span>
        </span>
        <ChevronDown className={cn("size-6 shrink-0 transition duration-300", open && "rotate-180")} />
      </button>

      <div className={cn("relative grid overflow-hidden transition-all duration-300", open ? "mt-5 max-h-[420px] gap-3 opacity-100" : "max-h-0 gap-0 opacity-0")}>
        {demoRoles.map((role) => (
          <button key={role.title} type="button" onClick={() => { void loginDemo(role); }} disabled={loadingRole !== null} className="group flex items-center gap-4 rounded-[1.2rem] bg-white/82 p-4 text-left shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60">
            <span className="grid size-11 place-items-center rounded-xl bg-black text-brand">
              <role.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black">{loadingRole === role.title ? "Входим..." : `Войти как ${role.title.toLowerCase()}`}</span>
              <span className="mt-0.5 block text-xs font-bold text-black/50">{role.helper}</span>
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </button>
        ))}
        {error ? <p className="rounded-[1rem] bg-white/80 p-3 text-sm font-black text-[#c83c3c]">{error}</p> : null}
      </div>
    </section>
  );
}
