"use client";

import { ArrowDownUp, Search } from "lucide-react";
import { useTaskFilters } from "@/features/task-filters/store";
import { Button } from "@/shared/ui/button";
import { Input, Select } from "@/shared/ui/form";

export function FeedToolbar() {
  const { search, setSearch } = useTaskFilters();

  return (
    <div className="premium-surface flex flex-col gap-3 rounded-[1.35rem] p-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/42" />
        <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск: фонд, навык, направление" />
      </div>
      <Select className="md:w-48" defaultValue="Сначала срочные">
        <option>Сначала срочные</option>
        <option>Больше часов</option>
        <option>Рядом со мной</option>
      </Select>
      <Button variant="secondary">
        <ArrowDownUp className="size-4" />
        Сортировка
      </Button>
    </div>
  );
}
