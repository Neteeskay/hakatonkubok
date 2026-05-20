"use client";

import { useMemo, useState } from "react";
import type { VolunteerTask } from "@/entities/task/model";
import { tasks } from "@/shared/config/mock-data";
import { useTaskFilters } from "@/features/task-filters/store";
import { FeedFilters } from "@/widgets/volunteer-feed/feed-filters";
import { FeedHero } from "@/widgets/volunteer-feed/feed-hero";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import { categoryLabels, formatLabels, skillLabels, taskStatusLabels } from "@/widgets/volunteer-feed/task-dictionaries";
import { TaskFeedEmpty } from "@/widgets/volunteer-feed/feed-states";
import { VolunteerTaskCard } from "@/widgets/volunteer-feed/volunteer-task-card";

type ApplicationStatus = "idle" | "pending" | "accepted" | "rejected" | "completed" | "hours";

export function VolunteerFeedPage() {
  const filters = useTaskFilters();
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({
    "task-002": "accepted",
    "task-003": "pending"
  });

  const visibleTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const next = tasks.filter((task) => {
      const haystack = [task.title, task.description, task.foundation, task.city, task.location, task.impact, ...task.skills.map((skill) => skillLabels[skill])].join(" ").toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.city !== "Все города" && task.city !== filters.city) return false;
      if (filters.format !== "Любой формат" && formatLabels[task.format] !== filters.format) return false;
      if (filters.category !== "Все категории" && categoryLabels[task.category] !== filters.category && task.foundation !== filters.category) return false;
      if (filters.proBono && !task.proBono) return false;
      if (filters.skill !== "Любые навыки" && !task.skills.some((skill) => skillLabels[skill] === filters.skill)) return false;
      if (filters.hours === "До 2 часов" && task.hours > 2) return false;
      if (filters.hours === "3-5 часов" && (task.hours < 3 || task.hours > 5)) return false;
      if (filters.hours === "6+ часов" && task.hours < 6) return false;
      if (filters.status !== "Любой статус" && taskStatusLabels[task.status] !== filters.status) return false;
      return task.status === "open" || task.status === "in_progress";
    });

    if (filters.sort === "Больше часов") return [...next].sort((a, b) => b.hours - a.hours);
    if (filters.sort === "Меньше часов") return [...next].sort((a, b) => a.hours - b.hours);
    if (filters.sort === "По дедлайну") return [...next].sort((a, b) => a.deadline.localeCompare(b.deadline));
    return next;
  }, [filters]);

  const selectedStatus = selectedTask ? statuses[selectedTask.id] ?? "idle" : "idle";

  return (
    <div className="space-y-5">
      <FeedHero />
      <FeedFilters resultCount={visibleTasks.length} />
      <section className="rounded-[1.55rem] bg-white/86 p-4 shadow-[0_20px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
        {visibleTasks.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleTasks.map((task) => (
              <VolunteerTaskCard key={task.id} task={task} onOpen={setSelectedTask} />
            ))}
          </div>
        ) : (
          <TaskFeedEmpty />
        )}
        {visibleTasks.length ? (
          <button className="mx-auto mt-5 flex h-11 w-full max-w-[620px] items-center justify-center rounded-full bg-white text-sm font-black text-black/76 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-[#fff8d7]">
            Показать ещё задания
          </button>
        ) : null}
      </section>
      <TaskDetailDrawer
        task={selectedTask}
        status={selectedStatus}
        onApply={() => {
          if (!selectedTask) return;
          setStatuses((current) => ({ ...current, [selectedTask.id]: "pending" }));
        }}
        onCancel={() => {
          if (!selectedTask) return;
          setStatuses((current) => ({ ...current, [selectedTask.id]: "idle" }));
        }}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
