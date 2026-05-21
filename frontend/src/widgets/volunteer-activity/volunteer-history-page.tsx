"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  historyEntries,
  historyFilters,
  historySummary,
  type VolunteerHistoryEntry
} from "@/widgets/volunteer-activity/history-data";
import { HistoryActivityPanel } from "@/widgets/volunteer-activity/ui/history-activity-panel";
import { HistorySummaryCard } from "@/widgets/volunteer-activity/ui/history-summary-card";
import { HistoryTimelineItem } from "@/widgets/volunteer-activity/ui/history-timeline-item";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

type FilterValue = (typeof historyFilters)[number]["value"];

export function VolunteerHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [selectedEntry, setSelectedEntry] = useState<VolunteerHistoryEntry | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>(
    Object.fromEntries(historyEntries.map((entry) => [entry.task.id, entry.detailStatus]))
  );

  const filteredEntries = useMemo(() => {
    return historyEntries.filter((entry) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "completed") return entry.status === "completed" || entry.status === "hours";
      if (activeFilter === "hours") return entry.status === "hours";
      if (activeFilter === "pending") return entry.status === "pending" || entry.status === "accepted" || entry.status === "in-progress";
      return true;
    });
  }, [activeFilter]);

  return (
    <section className="rounded-[1.55rem] bg-white p-4 shadow-[0_20px_70px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-none md:text-4xl">История помощи</h1>
          <p className="mt-3 text-sm font-bold text-black/54">Ваш путь добрых дел</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-black text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12 md:self-auto">
          Скачать отчёт
          <Download className="size-4" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {historySummary.map((item) => (
          <HistorySummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="mt-6 rounded-[1.35rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {historyFilters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "h-10 rounded-xl px-4 text-sm font-black transition",
                    active ? "bg-black text-white shadow-[0_12px_24px_rgba(24,20,7,0.14)]" : "bg-[#faf9f4] text-black/58 hover:bg-brand/12 hover:text-black"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
            <CalendarDays className="size-4" />
            За всё время
          </button>
        </div>

        <div className="relative mt-5 before:absolute before:left-[72px] before:top-5 before:h-[calc(100%-2.5rem)] before:border-l before:border-dashed before:border-black/10">
          {filteredEntries.map((entry) => (
            <HistoryTimelineItem key={entry.id} entry={entry} onOpen={setSelectedEntry} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <HistoryActivityPanel />
      </div>

      <TaskDetailDrawer
        task={selectedEntry?.task ?? null}
        status={selectedEntry ? statuses[selectedEntry.task.id] ?? selectedEntry.detailStatus : "idle"}
        onStatusChange={(status) => {
          if (!selectedEntry) return;
          setStatuses((current) => ({ ...current, [selectedEntry.task.id]: status }));
        }}
        onClose={() => setSelectedEntry(null)}
        onTaskOpen={(task) => {
          const next = historyEntries.find((entry) => entry.task.id === task.id);
          if (next) setSelectedEntry(next);
        }}
      />
    </section>
  );
}
