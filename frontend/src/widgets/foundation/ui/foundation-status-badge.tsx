import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { foundationToneStyles, type FoundationTone } from "@/widgets/foundation/foundation-data";

export function FoundationStatusBadge({ children, tone }: { children: ReactNode; tone: FoundationTone }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-black", foundationToneStyles[tone].badge)}>
      {children}
    </span>
  );
}
