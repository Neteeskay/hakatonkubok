import * as React from "react";
import { cn } from "@/shared/lib/utils";

const tones = {
  neutral: "bg-surface-muted text-foreground/72",
  brand: "bg-brand-soft text-foreground",
  green: "bg-lime-300 text-foreground",
  red: "bg-red-500 text-white",
  blue: "bg-sky-200 text-foreground"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-extrabold", tones[tone], className)}
      {...props}
    />
  );
}

export const Chip = Badge;
