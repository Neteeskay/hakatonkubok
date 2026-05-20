"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input, Select } from "@/shared/ui/form";
import { useTaskFilters } from "@/features/task-filters/store";

export function TaskFilterBar() {
  const { city, format, search, setCity, setFormat, setSearch } = useTaskFilters();

  return (
    <div className="flex flex-col gap-3 rounded-[1.35rem] bg-surface p-3 shadow-panel md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/42" />
        <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по задачам, фондам, навыкам" />
      </div>
      <Select value={city} onChange={(event) => setCity(event.target.value)} className="md:w-44">
        <option>Все города</option>
        <option>Москва</option>
        <option>Санкт-Петербург</option>
        <option>Онлайн</option>
      </Select>
      <Select value={format} onChange={(event) => setFormat(event.target.value)} className="md:w-44">
        <option>Любой формат</option>
        <option>Офлайн</option>
        <option>Онлайн</option>
        <option>Гибрид</option>
      </Select>
      <Button variant="ghost" className="md:w-auto">
        <SlidersHorizontal className="size-4" />
        Фильтры
      </Button>
    </div>
  );
}
