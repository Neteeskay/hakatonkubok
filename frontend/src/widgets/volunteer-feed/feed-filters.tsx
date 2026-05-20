"use client";

import type { ReactNode } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { categories, foundations } from "@/shared/config/mock-data";
import { useTaskFilters } from "@/features/task-filters/store";
import { categoryLabels, skillLabels } from "@/widgets/volunteer-feed/task-dictionaries";
import { cn } from "@/shared/lib/utils";

const formatOptions = ["Любой формат", "Онлайн", "Офлайн", "Гибрид"];
const dateOptions = ["Любая дата", "Сегодня", "На этой неделе", "В выходные"];
const deadlineOptions = ["Любой дедлайн", "До 3 дней", "До недели", "Без спешки"];
const hoursOptions = ["Любые часы", "До 2 часов", "3-5 часов", "6+ часов"];
const statusOptions = ["Любой статус", "Набор открыт", "В работе"];
const sortOptions = ["Сначала новые", "По дедлайну", "Больше часов", "Меньше часов"];
const categoryOptions = Array.from(new Set(["Все категории", ...categories, ...Object.values(categoryLabels)]));

export function FeedFilters({ resultCount }: { resultCount: number }) {
  const {
    search,
    setSearch,
    format,
    setFormat,
    city,
    setCity,
    category,
    setCategory,
    deadline,
    setDeadline,
    proBono,
    setProBono,
    skill,
    setSkill,
    hours,
    setHours,
    status,
    setStatus,
    sort,
    setSort,
    reset
  } = useTaskFilters();

  return (
    <section className="rounded-[1.35rem] bg-white/92 p-4 shadow-[0_18px_60px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
      <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
        <label className="flex h-12 items-center gap-3 rounded-full bg-[#f7f7f4] px-5 text-[15px] text-black/52 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.05)]">
          <span className="sr-only">Поиск</span>
          <span className="min-w-0 flex-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по заданиям, фондам и навыкам"
              className="h-full w-full bg-transparent outline-none placeholder:text-black/42"
            />
          </span>
          <Search className="size-5 text-black" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <SelectPill label="Сортировка" value={sort} onChange={setSort} options={sortOptions} icon={<SlidersHorizontal className="size-4" />} />
          <button onClick={reset} className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-black/58 transition hover:bg-[#fff7c7]">
            <RotateCcw className="size-4" />
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SelectPill label="Категория помощи" value={category} onChange={setCategory} options={categoryOptions} />
        <SelectPill label="Формат" value={format} onChange={setFormat} options={formatOptions} />
        <SelectPill label="Город" value={city} onChange={setCity} options={["Все города", "Москва", "Санкт-Петербург", "Казань", "Онлайн"]} />
        <SelectPill label="Дата" value={deadline} onChange={setDeadline} options={[...dateOptions, ...deadlineOptions]} />
        <SelectPill label="Часы" value={hours} onChange={setHours} options={hoursOptions} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChip active={!proBono} onClick={() => setProBono(false)}>Все задания <span>{resultCount}</span></FilterChip>
        <FilterChip active={proBono} onClick={() => setProBono(true)}>Pro bono</FilterChip>
        <SelectChip value={skill} onChange={setSkill} options={["Любые навыки", ...Object.values(skillLabels)]} />
        <SelectChip value={status} onChange={setStatus} options={statusOptions} />
        <FilterChip active={format === "Онлайн"} onClick={() => setFormat(format === "Онлайн" ? "Любой формат" : "Онлайн")}>Онлайн</FilterChip>
        <FilterChip active={format === "Офлайн"} onClick={() => setFormat(format === "Офлайн" ? "Любой формат" : "Офлайн")}>Офлайн</FilterChip>
      </div>
    </section>
  );
}

function SelectPill({ label, value, options, onChange, icon }: { label: string; value: string; options: string[]; onChange: (value: string) => void; icon?: ReactNode }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl bg-white px-4 pr-9 text-sm font-bold text-black/72 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] outline-none transition hover:bg-[#fffdf2] focus:shadow-[inset_0_0_0_2px_rgba(255,204,0,0.85)]"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/45">{icon ?? "⌄"}</span>
    </label>
  );
}

function SelectChip({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-full bg-white px-4 pr-8 text-sm font-bold text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] outline-none hover:bg-[#fff8d7]"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/38">⌄</span>
    </label>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition",
        active ? "bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]" : "bg-white text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] hover:bg-[#fff8d7]"
      )}
    >
      {children}
    </button>
  );
}
