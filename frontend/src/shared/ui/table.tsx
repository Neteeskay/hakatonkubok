import * as React from "react";
import { cn } from "@/shared/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-separate border-spacing-y-2 text-left text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-foreground/45", className)} {...props} />;
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("bg-surface-raised px-4 py-3 align-middle first:rounded-l-xl last:rounded-r-xl", className)} {...props} />;
}
