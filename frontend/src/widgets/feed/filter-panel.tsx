"use client";

import { Check, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { taskApi } from "@/shared/api/services";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form";
import { cn } from "@/shared/lib/utils";

const categories = ["children", "elderly", "disability", "ecology"];

const formats = ["Онлайн", "Офлайн", "Гибрид"];
const commitments = ["Разово", "Регулярно", "Долгий проект", "Pro bono"];
const skills = ["События", "Логистика", "Дизайн", "Медиа", "Аналитика", "Наставничество"];

export function FilterPanel() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "feed", "filter-panel"],
    queryFn: () => taskApi.listFeed()
  });
  const foundations = Array.from(new Set(tasks.map((task) => task.fund?.name).filter((name): name is string => Boolean(name))));

  return (
    <aside className="premium-surface space-y-5 rounded-[1.35rem] p-4 lg:sticky lg:top-24 lg:h-fit">
      <div className="flex items-center justify-between">
        <h3 className="text-base">Фильтры</h3>
        <Button variant="quiet" size="sm">
          <RotateCcw className="size-4" />
          Сброс
        </Button>
      </div>
      <FilterGroup title="Формат" items={formats} active={["Онлайн"]} />
      <FilterGroup title="Тип участия" items={commitments} active={["Разово", "Pro bono"]} />
      <FilterGroup title="Направления" items={categories} active={["Спорт"]} />
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-foreground/45">Город</p>
        <Select defaultValue="Все города">
          <option>Все города</option>
          <option>Москва</option>
          <option>Санкт-Петербург</option>
          <option>Казань</option>
          <option>Онлайн</option>
        </Select>
      </div>
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-foreground/45">Фонд</p>
        <Select defaultValue="Любой фонд">
          <option>Любой фонд</option>
          {foundations.map((foundation) => <option key={foundation}>{foundation}</option>)}
        </Select>
      </div>
      <FilterGroup title="Навыки" items={skills} active={["Дизайн"]} />
    </aside>
  );
}

function FilterGroup({ title, items, active }: { title: string; items: string[]; active: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-foreground/45">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = active.includes(item);
          return (
            <button
              key={item}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition",
                selected ? "bg-black text-brand" : "bg-white/70 text-foreground/68 hover:bg-brand-soft hover:text-foreground"
              )}
            >
              {selected ? <Check className="size-3.5" /> : null}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
