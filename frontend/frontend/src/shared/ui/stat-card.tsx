import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { cn, formatNumber } from "@/shared/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: number | string;
  delta?: string;
  icon: LucideIcon;
  tone?: "neutral" | "brand" | "green" | "blue";
}) {
  return (
    <Card className="transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-bold text-foreground/58">{label}</p>
          <p className="mt-2 text-3xl font-black">{typeof value === "number" ? formatNumber(value) : value}</p>
          {delta ? <p className="mt-1 text-xs text-foreground/52">{delta}</p> : null}
        </div>
        <div
          className={cn(
            "grid size-12 place-items-center rounded-2xl shadow-[0_14px_34px_rgba(0,0,0,0.08)]",
            tone === "brand" && "bg-brand text-black",
            tone === "green" && "bg-lime-300 text-black",
            tone === "blue" && "bg-sky-200 text-black",
            tone === "neutral" && "bg-black text-brand"
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
