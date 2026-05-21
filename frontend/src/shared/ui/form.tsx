import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-white/76 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition",
        "placeholder:text-foreground/42 focus:shadow-focus",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl bg-white/76 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition",
        "placeholder:text-foreground/42 focus:shadow-focus",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-xl bg-white/76 px-4 pr-9 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition",
          "focus:shadow-focus",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/48" />
    </span>
  );
}
