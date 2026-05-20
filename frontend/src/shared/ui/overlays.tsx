"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/32 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-lg rounded-[1.35rem] bg-surface shadow-panel">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="quiet" size="icon" aria-label="Закрыть" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onOpenChange,
  children,
  className
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-foreground/32" onClick={() => onOpenChange(false)}>
      <aside
        className={cn("ml-auto h-full w-full max-w-sm bg-surface p-5 shadow-panel", className)}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  );
}

export function Dropdown({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={ref} className="relative">
      <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted" onClick={() => setOpen(!open)}>
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-52 rounded-xl bg-surface p-2 shadow-panel" onClick={() => setOpen(false)}>{children}</div>
      ) : null}
    </div>
  );
}
