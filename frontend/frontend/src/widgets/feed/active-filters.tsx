import { X } from "lucide-react";

export function ActiveFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {["Онлайн", "Pro bono", "Спорт", "до 7 дней"].map((filter) => (
        <button key={filter} className="inline-flex h-8 items-center gap-2 rounded-xl bg-brand-soft px-3 text-sm font-bold">
          {filter}
          <X className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
