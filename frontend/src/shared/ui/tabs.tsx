"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

export function Tabs({
  items,
  value,
  onChange,
  className
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg bg-surface-muted p-1", className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium text-foreground/62 transition",
            value === item.value && "bg-surface text-foreground shadow-sm"
          )}
          onClick={() => onChange(item.value)}
          role="tab"
          aria-selected={value === item.value}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
