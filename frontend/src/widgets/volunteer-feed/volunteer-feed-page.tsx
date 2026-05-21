"use client";

import { useEffect, useMemo, useState } from "react";
import type { VolunteerTask } from "@/entities/task/model";
import { applicationsService, getApiErrorMessage, tasksService } from "@/shared/api";
import { useTaskFilters } from "@/features/task-filters/store";
import { FeedFilters } from "@/widgets/volunteer-feed/feed-filters";
import { FeedHero } from "@/widgets/volunteer-feed/feed-hero";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import { formatLabels, getCategoryLabel, getSkillLabel, taskStatusLabels } from "@/widgets/volunteer-feed/task-dictionaries";
import { TaskFeedEmpty, TaskFeedError, TaskFeedSkeleton } from "@/widgets/volunteer-feed/feed-states";
import { VolunteerTaskCard } from "@/widgets/volunteer-feed/volunteer-task-card";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";
import { apiStatusToDetailStatus } from "@/widgets/volunteer-activity/activity-api-mappers";
import { mapTaskResponseToVolunteerTask } from "@/widgets/volunteer-feed/task-api-mappers";

export function VolunteerFeedPage() {
  const filters = useTaskFilters();
  const [feedTasks, setFeedTasks] = useState<VolunteerTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [applicationIds, setApplicationIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      setLoading(true);
      setError(null);

      try {
        const [taskResponses, applicationResponses] = await Promise.all([
          tasksService.getTaskFeed({ limit: 100 }),
          applicationsService.getMyApplications()
        ]);

        if (!mounted) return;

        setFeedTasks(taskResponses.map(mapTaskResponseToVolunteerTask));
        setStatuses(Object.fromEntries(applicationResponses.map((item) => [item.task_id, apiStatusToDetailStatus(item.status)])));
        setApplicationIds(Object.fromEntries(applicationResponses.map((item) => [item.task_id, item.id])));
      } catch (loadError) {
        if (!mounted) return;
        setError(getApiErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadFeed();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const next = feedTasks.filter((task) => {
      const haystack = [task.title, task.description, task.foundation, task.city, task.location, task.impact, ...task.skills.map(getSkillLabel)].join(" ").toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.city !== "Все города" && task.city !== filters.city) return false;
      if (filters.format !== "Любой формат" && formatLabels[task.format] !== filters.format) return false;
      if (filters.category !== "Все категории" && getCategoryLabel(task.category) !== filters.category && task.foundation !== filters.category) return false;
      if (filters.proBono && !task.proBono) return false;
      if (filters.skill !== "Любые навыки" && !task.skills.some((skill) => getSkillLabel(skill) === filters.skill)) return false;
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
  }, [feedTasks, filters]);

  const selectedStatus = selectedTask ? statuses[selectedTask.id] ?? "idle" : "idle";
  const applicationSubmitting = Boolean(selectedTask && submittingTaskId === selectedTask.id);

  async function applyToTask(task: VolunteerTask) {
    setSubmittingTaskId(task.id);
    setApplicationError(null);

    try {
      const application = await applicationsService.applyToTask(task.id);
      setStatuses((current) => ({ ...current, [task.id]: apiStatusToDetailStatus(application.status) }));
      setApplicationIds((current) => ({ ...current, [task.id]: application.id }));
    } catch (applyError) {
      setApplicationError(getApiErrorMessage(applyError));
    } finally {
      setSubmittingTaskId(null);
    }
  }

  async function cancelApplication(task: VolunteerTask) {
    const applicationId = applicationIds[task.id];

    if (!applicationId) {
      setApplicationError("Не удалось найти отклик для отмены. Обновите страницу и попробуйте ещё раз.");
      return;
    }

    setSubmittingTaskId(task.id);
    setApplicationError(null);

    try {
      const application = await applicationsService.cancelMyApplication(applicationId);
      setStatuses((current) => ({ ...current, [task.id]: apiStatusToDetailStatus(application.status) }));
    } catch (cancelError) {
      setApplicationError(getApiErrorMessage(cancelError));
    } finally {
      setSubmittingTaskId(null);
    }
  }

  return (
    <div className="space-y-5">
      <FeedHero />
      <FeedFilters resultCount={visibleTasks.length} />
      <section className="rounded-[1.55rem] bg-white/86 p-4 shadow-[0_20px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
        {loading ? (
          <TaskFeedSkeleton />
        ) : error ? (
          <TaskFeedError message={error} />
        ) : visibleTasks.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleTasks.map((task) => (
              <VolunteerTaskCard key={task.id} task={task} onOpen={setSelectedTask} />
            ))}
          </div>
        ) : (
          <TaskFeedEmpty />
        )}
        {!loading && !error && visibleTasks.length ? (
          <button className="mx-auto mt-5 flex h-11 w-full max-w-[620px] items-center justify-center rounded-full bg-white text-sm font-black text-black/76 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
            Показать ещё задания
          </button>
        ) : null}
      </section>
      <TaskDetailDrawer
        task={selectedTask}
        allTasks={feedTasks}
        status={selectedStatus}
        applicationError={applicationError}
        applicationSubmitting={applicationSubmitting}
        onApply={applyToTask}
        onCancelApplication={cancelApplication}
        onStatusChange={(status) => {
          if (!selectedTask) return;
          setStatuses((current) => ({ ...current, [selectedTask.id]: status }));
        }}
        onClose={() => setSelectedTask(null)}
        onTaskOpen={setSelectedTask}
      />
    </div>
  );
}
