import { Inbox } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[1.35rem] bg-surface-muted", className)} />;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-[1.35rem] bg-surface px-6 py-12 text-center shadow-panel">
      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-soft">
        <Inbox className="size-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-foreground/62">{description}</p>
    </div>
  );
}
