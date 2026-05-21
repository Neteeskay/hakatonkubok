"use client";

import Link from "next/link";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { RegistrationRole } from "@/widgets/auth/model/auth-types";

const roles = [
  {
    id: "volunteer",
    title: "Волонтёр",
    text: "Для сотрудников Столото: задания, отклики, часы и достижения.",
    icon: UserRound
  },
  {
    id: "foundation",
    title: "Фонд",
    text: "Для НКО и партнёров: регистрация организации и проверка документов.",
    icon: Building2
  }
] satisfies { id: RegistrationRole; title: string; text: string; icon: typeof UserRound }[];

export function RegistrationRoleCards({ value, onChange }: { value: RegistrationRole; onChange: (value: RegistrationRole) => void }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">Зарегистрироваться как</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {roles.map((role) => {
          const active = role.id === value;
          const content = (
            <span className={cn("group flex min-h-[132px] flex-col rounded-[1.35rem] p-4 text-left transition", active ? "bg-brand text-black shadow-[0_18px_40px_rgba(255,227,0,0.24)]" : "bg-[#fffdf7] text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)] hover:bg-brand/12")}>
              <span className="flex items-start justify-between gap-4">
                <span className={cn("grid size-11 place-items-center rounded-2xl", active ? "bg-white/70" : "bg-white")}>
                  <role.icon className="size-5" />
                </span>
                {role.id === "foundation" ? <ArrowRight className="size-5 transition group-hover:translate-x-1" /> : null}
              </span>
              <span className="mt-4 block text-lg font-black">{role.title}</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-black/55">{role.text}</span>
            </span>
          );

          if (role.id === "foundation") {
            return <Link key={role.id} href="/register/foundation">{content}</Link>;
          }

          return <button key={role.id} type="button" onClick={() => onChange(role.id)}>{content}</button>;
        })}
      </div>
    </div>
  );
}
