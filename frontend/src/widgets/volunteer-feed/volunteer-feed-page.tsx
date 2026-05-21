"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VolunteerTask } from "@/entities/task/model";
import { useTaskFilters } from "@/features/task-filters/store";
import { applicationApi, taskApi } from "@/shared/api/services";
import { mapApiTaskToVolunteerTask, mapApplicationStatus } from "@/shared/api/mappers";
import { FeedFilters } from "@/widgets/volunteer-feed/feed-filters";
import { FeedHero } from "@/widgets/volunteer-feed/feed-hero";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import { categoryLabels, formatLabels, getSkillLabel, taskStatusLabels } from "@/widgets/volunteer-feed/task-dictionaries";
import { TaskFeedEmpty } from "@/widgets/volunteer-feed/feed-states";
import { VolunteerTaskCard } from "@/widgets/volunteer-feed/volunteer-task-card";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

export function VolunteerFeedPage() {
  const filters = useTaskFilters();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks", "feed"],
    queryFn: () => taskApi.listFeed()
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications", "my"],
    queryFn: () => applicationApi.listMine()
  });

  const applications = applicationsQuery.data ?? [];
  const applicationsByTask = useMemo(() => new Map(applications.map((application) => [application.task_id, application])), [applications]);
  const tasks = useMemo(() => (tasksQuery.data ?? []).map((task) => mapApiTaskToVolunteerTask(task, applications)), [applications, tasksQuery.data]);

  const applyMutation = useMutation({
    mutationFn: (task: VolunteerTask) => applicationApi.apply(task.id),
    onSuccess: async () => {
      setApplicationError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error) => setApplicationError(error instanceof Error ? error.message : "Не удалось отправить отклик")
  });

  const cancelMutation = useMutation({
    mutationFn: (task: VolunteerTask) => {
      const application = applicationsByTask.get(task.id);
      if (!application) throw new Error("Отклик не найден");
      return applicationApi.cancel(application.id);
    },
    onSuccess: async () => {
      setApplicationError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error) => setApplicationError(error instanceof Error ? error.message : "Не удалось отменить отклик")
  });

  const visibleTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const next = tasks.filter((task) => {
      const haystack = [task.title, task.description, task.foundation, task.city, task.location, task.impact, ...task.skills.map(getSkillLabel)].join(" ").toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.city !== "Ð’ÑÐµ Ð³Ð¾Ñ€Ð¾Ð´Ð°" && filters.city !== "Все города" && task.city !== filters.city) return false;
      if (filters.format !== "Ð›ÑŽÐ±Ð¾Ð¹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚" && filters.format !== "Любой формат" && formatLabels[task.format] !== filters.format) return false;
      if (filters.category !== "Ð’ÑÐµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸" && filters.category !== "Все категории" && categoryLabels[task.category] !== filters.category && task.foundation !== filters.category) return false;
      if (filters.proBono && !task.proBono) return false;
      if (filters.skill !== "Ð›ÑŽÐ±Ñ‹Ðµ Ð½Ð°Ð²Ñ‹ÐºÐ¸" && filters.skill !== "Любые навыки" && !task.skills.some((skill) => getSkillLabel(skill) === filters.skill)) return false;
      if ((filters.hours === "Ð”Ð¾ 2 Ñ‡Ð°ÑÐ¾Ð²" || filters.hours === "До 2 часов") && task.hours > 2) return false;
      if ((filters.hours === "3-5 Ñ‡Ð°ÑÐ¾Ð²" || filters.hours === "3-5 часов") && (task.hours < 3 || task.hours > 5)) return false;
      if ((filters.hours === "6+ Ñ‡Ð°ÑÐ¾Ð²" || filters.hours === "6+ часов") && task.hours < 6) return false;
      if (filters.status !== "Ð›ÑŽÐ±Ð¾Ð¹ ÑÑ‚Ð°Ñ‚ÑƒÑ" && filters.status !== "Любой статус" && taskStatusLabels[task.status] !== filters.status) return false;
      return task.status === "open" || task.status === "in_progress";
    });

    if (filters.sort === "Ð‘Ð¾Ð»ÑŒÑˆÐµ Ñ‡Ð°ÑÐ¾Ð²" || filters.sort === "Больше часов") return [...next].sort((a, b) => b.hours - a.hours);
    if (filters.sort === "ÐœÐµÐ½ÑŒÑˆÐµ Ñ‡Ð°ÑÐ¾Ð²" || filters.sort === "Меньше часов") return [...next].sort((a, b) => a.hours - b.hours);
    if (filters.sort === "ÐŸÐ¾ Ð´ÐµÐ´Ð»Ð°Ð¹Ð½Ñƒ" || filters.sort === "По дедлайну") return [...next].sort((a, b) => a.deadline.localeCompare(b.deadline));
    return next;
  }, [filters, tasks]);

  const selectedApplication = selectedTask ? applicationsByTask.get(selectedTask.id) : undefined;
  const selectedStatus: ApplicationStatus = selectedApplication ? mapApplicationStatus(selectedApplication.status) : "idle";
  const isLoading = tasksQuery.isLoading || applicationsQuery.isLoading;
  const isMutating = applyMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-5">
      <FeedHero />
      <FeedFilters resultCount={visibleTasks.length} />
      <section className="rounded-[1.55rem] bg-white/86 p-4 shadow-[0_20px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
        {tasksQuery.isError ? (
          <div className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
            <p className="text-2xl font-black">Не удалось загрузить задания</p>
            <button onClick={() => void tasksQuery.refetch()} className="mt-4 h-11 rounded-full bg-brand px-6 text-sm font-black text-black">Повторить</button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[320px] animate-pulse rounded-[1.15rem] bg-white/70" />
            ))}
          </div>
        ) : visibleTasks.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleTasks.map((task) => (
              <VolunteerTaskCard key={task.id} task={task} onOpen={setSelectedTask} />
            ))}
          </div>
        ) : (
          <TaskFeedEmpty />
        )}
        {visibleTasks.length ? (
          <button className="mx-auto mt-5 flex h-11 w-full max-w-[620px] items-center justify-center rounded-full bg-white text-sm font-black text-black/76 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
            Показать еще задания
          </button>
        ) : null}
      </section>
      <TaskDetailDrawer
        applicationError={applicationError}
        isApplicationMutating={isMutating}
        onApply={async (task) => {
          await applyMutation.mutateAsync(task);
        }}
        onCancel={async (task) => {
          await cancelMutation.mutateAsync(task);
        }}
        onClose={() => setSelectedTask(null)}
        onStatusChange={() => undefined}
        onTaskOpen={setSelectedTask}
        status={selectedStatus}
        task={selectedTask}
        tasks={tasks}
      />
    </div>
  );
}
