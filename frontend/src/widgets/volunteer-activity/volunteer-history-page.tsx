"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { getApiErrorMessage, volunteersService } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import {
  historyFilters,
  type VolunteerHistoryEntry
} from "@/widgets/volunteer-activity/history-data";
import {
  buildCityContribution,
  buildHistorySummary,
  buildMonthlyActivity,
  mapHistoryResponseToEntry
} from "@/widgets/volunteer-activity/activity-api-mappers";
import { HistoryActivityPanel } from "@/widgets/volunteer-activity/ui/history-activity-panel";
import { HistorySummaryCard } from "@/widgets/volunteer-activity/ui/history-summary-card";
import { HistoryTimelineItem } from "@/widgets/volunteer-activity/ui/history-timeline-item";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

type FilterValue = (typeof historyFilters)[number]["value"];

export function VolunteerHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [entries, setEntries] = useState<VolunteerHistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<VolunteerHistoryEntry | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await volunteersService.getMyVolunteerHistory({ limit: 100 });
        if (!mounted) return;

        const nextEntries = response.map(mapHistoryResponseToEntry);
        setEntries(nextEntries);
        setStatuses(Object.fromEntries(nextEntries.map((entry) => [entry.task.id, entry.detailStatus])));
      } catch (loadError) {
        if (!mounted) return;
        setError(getApiErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "completed") return entry.status === "completed" || entry.status === "hours";
      if (activeFilter === "hours") return entry.status === "hours";
      if (activeFilter === "pending") return entry.status === "pending" || entry.status === "accepted" || entry.status === "in-progress" || entry.status === "completed";
      return true;
    });
  }, [activeFilter, entries]);

  const summary = useMemo(() => buildHistorySummary(entries), [entries]);
  const monthly = useMemo(() => buildMonthlyActivity(entries), [entries]);
  const cities = useMemo(() => buildCityContribution(entries), [entries]);
  const allTasks = useMemo(() => entries.map((entry) => entry.task), [entries]);

  return (
    <section className="rounded-[1.55rem] bg-white p-4 shadow-[0_20px_70px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-none md:text-4xl">История помощи</h1>
          <p className="mt-3 text-sm font-bold text-black/54">Ваш путь добрых дел</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
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
          {loading ? (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">Загружаем историю...</p>
            </section>
          ) : error ? (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">Не удалось загрузить историю</p>
              <p className="mt-3 text-sm font-medium text-black/54">{error}</p>
            </section>
          ) : filteredEntries.length ? filteredEntries.map((entry) => (
            <HistoryTimelineItem key={entry.id} entry={entry} onOpen={setSelectedEntry} />
          )) : (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">История пока пустая</p>
              <p className="mt-3 text-sm font-medium text-black/54">После участия в заданиях события появятся здесь.</p>
            </section>
          )}
        </div>
      </div>

      <div className="mt-6">
        <HistoryActivityPanel monthly={monthly} cities={cities} />
      </div>

      <TaskDetailDrawer
        task={selectedEntry?.task ?? null}
        allTasks={allTasks}
        status={selectedEntry ? statuses[selectedEntry.task.id] ?? selectedEntry.detailStatus : "idle"}
        onStatusChange={(status) => {
          if (!selectedEntry) return;
          setStatuses((current) => ({ ...current, [selectedEntry.task.id]: status }));
        }}
        onClose={() => setSelectedEntry(null)}
        onTaskOpen={(task) => {
          const next = entries.find((entry) => entry.task.id === task.id);
          if (next) setSelectedEntry(next);
        }}
      />
    </section>
  );
}
