"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

export function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  invalid,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password" | "tel";
  icon?: LucideIcon;
  invalid?: boolean;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</span>
      <span
        className={cn(
        "mt-2 flex h-12 items-center gap-3 rounded-2xl bg-[#fffdf7] px-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition focus-within:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.85)]",
          invalid && "shadow-[inset_0_0_0_2px_rgba(239,68,68,0.72)]"
        )}
      >
        {Icon ? <Icon className="size-4 text-black/42" /> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={isPassword ? (visible ? "text" : "password") : type}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/32"
        />
        {isPassword ? (
          <button type="button" onClick={() => setVisible((current) => !current)} className="grid size-8 place-items-center rounded-full text-black/46 hover:bg-black/5" aria-label={visible ? "Скрыть пароль" : "Показать пароль"}>
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-2 block text-xs font-bold leading-5 text-[#c83c3c]">{error}</span> : null}
    </label>
  );
}

export function OptionChips({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-black transition",
                active ? "bg-brand text-black shadow-[0_10px_22px_rgba(255,227,0,0.24)]" : "bg-[#f4f3ee] text-black/58 hover:bg-brand/12 hover:text-black"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
