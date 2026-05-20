"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/widgets/navigation/logo";
import { cn } from "@/shared/lib/utils";

type AuthMode = "login" | "register" | "recovery";

const roleLinks = [
  { title: "Волонтёр", text: "Сотрудник Столото", href: "/volunteer", registerHref: "/register/volunteer", icon: UserRound },
  { title: "Фонд", text: "НКО и партнёры", href: "/foundation", registerHref: "/register/foundation", icon: Building2 },
  { title: "Админ demo", text: "Модерация и отчётность", href: "/admin", registerHref: "/admin", icon: ShieldCheck }
];

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <main className="min-h-screen bg-[#fffdf7] p-4">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_26px_90px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative">
            <Logo size="landing" />
            <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-black/38">Помогать просто</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.94] md:text-7xl">Единый вход в платформу</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-black/64">Вход, регистрация и восстановление доступа в одном аккуратном mock-flow без backend-интеграций.</p>
            <div className="mt-9 grid grid-cols-3 gap-2 rounded-full bg-[#f4f2ea] p-1">
              {[
                ["login", "Вход"],
                ["register", "Регистрация"],
                ["recovery", "Доступ"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMode(value as AuthMode)}
                  className={cn("h-11 rounded-full text-sm font-black transition", mode === value ? "bg-brand text-black shadow-[0_12px_30px_rgba(255,204,0,0.28)]" : "text-black/52 hover:text-black")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-[0_26px_90px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-6">
          {mode === "login" ? <LoginMode /> : null}
          {mode === "register" ? <RegisterMode /> : null}
          {mode === "recovery" ? <RecoveryMode /> : null}
        </div>
      </section>
    </main>
  );
}

function LoginMode() {
  return (
    <div>
      <h2 className="text-3xl font-black">Выберите роль</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Demo-вход открывает готовый frontend-сценарий выбранной роли.</p>
      <div className="mt-5 grid gap-3">
        {roleLinks.map((role) => (
          <Link key={role.title} href={role.href} className="group flex items-center gap-4 rounded-[1.25rem] bg-[#fffdf7] p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:-translate-y-0.5 hover:bg-[#fff8d7]">
            <span className="grid size-12 place-items-center rounded-xl bg-brand"><role.icon className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black">{role.title}</span>
              <span className="block text-sm text-black/52">{role.text}</span>
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function RegisterMode() {
  return (
    <div>
      <h2 className="text-3xl font-black">Регистрация</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Отдельные сценарии для сотрудника-волонтёра и фонда с модерацией.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {roleLinks.slice(0, 2).map((role) => (
          <Link key={role.title} href={role.registerHref} className="rounded-[1.25rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:-translate-y-0.5 hover:bg-[#fff8d7]">
            <role.icon className="size-8" />
            <h3 className="mt-5 text-xl font-black">{role.title}</h3>
            <p className="mt-2 text-sm leading-6 text-black/56">{role.title === "Волонтёр" ? "Через корпоративную почту или employee id." : "С документами, контактами и ожиданием модерации."}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecoveryMode() {
  return (
    <div>
      <h2 className="text-3xl font-black">Восстановление доступа</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Mock-flow для письма с одноразовой ссылкой.</p>
      <label className="mt-6 flex h-14 items-center gap-3 rounded-2xl bg-[#fffdf7] px-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]">
        <Mail className="size-5 text-black/48" />
        <input placeholder="corporate@email.ru" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/36" />
      </label>
      <button className="mt-4 h-12 w-full rounded-2xl bg-brand text-sm font-black text-black shadow-[0_14px_32px_rgba(255,204,0,0.28)]">Отправить ссылку</button>
      <p className="mt-4 rounded-2xl bg-[#fff8d7] p-4 text-sm leading-6 text-black/62">После восстановления пользователь возвращается в свой ролевой кабинет: волонтёр, фонд или администратор.</p>
    </div>
  );
}
