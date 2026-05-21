import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { adminToneStyles, type AdminTone } from "@/widgets/admin/admin-data";

export function AdminStatusBadge({ tone, children }: { tone: AdminTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-black", adminToneStyles[tone].badge)}>
      {children}
    </span>
  );
}

export function AdminSoftSurface({ tone, children, className }: { tone: AdminTone; children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[1.35rem] p-4", adminToneStyles[tone].surface, className)}>{children}</div>;
}
