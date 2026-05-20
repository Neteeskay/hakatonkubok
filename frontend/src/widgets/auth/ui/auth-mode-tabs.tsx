"use client";

import type { AuthMode } from "@/widgets/auth/model/auth-types";
import { cn } from "@/shared/lib/utils";

const modes: { value: AuthMode; label: string }[] = [
  { value: "login", label: "Вход" },
  { value: "register", label: "Регистрация" },
  { value: "recovery", label: "Доступ" }
];

export function AuthModeTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-full bg-[#f4f2ea] p-1">
      {modes.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn("h-11 rounded-full text-sm font-black transition", mode === item.value ? "bg-brand text-black shadow-[0_12px_30px_rgba(255,227,0,0.28)]" : "text-black/52 hover:text-black")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
