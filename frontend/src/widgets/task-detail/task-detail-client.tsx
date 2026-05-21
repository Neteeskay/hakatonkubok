"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VolunteerTask } from "@/entities/task/model";
import { applicationApi, taskApi } from "@/shared/api/services";
import { foundationFromTask, mapApiTaskToVolunteerTask, mapApplicationStatus } from "@/shared/api/mappers";
import { TaskDetailPage } from "@/widgets/task-detail/task-detail-page";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

export function TaskDetailClient({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const taskQuery = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => taskApi.get(taskId)
  });
  const feedQuery = useQuery({
    queryKey: ["tasks", "feed"],
    queryFn: () => taskApi.listFeed()
  });
  const applicationsQuery = useQuery({
    queryKey: ["applications", "my"],
    queryFn: () => applicationApi.listMine()
  });

  const applications = applicationsQuery.data ?? [];
  const task = useMemo(() => (taskQuery.data ? mapApiTaskToVolunteerTask(taskQuery.data, applications) : null), [applications, taskQuery.data]);
  const related = useMemo(
    () =>
      (feedQuery.data ?? [])
        .filter((item) => item.id !== taskId && (item.category === taskQuery.data?.category || item.fund_id === taskQuery.data?.fund_id))
        .slice(0, 2)
        .map((item) => mapApiTaskToVolunteerTask(item, applications)),
    [applications, feedQuery.data, taskId, taskQuery.data?.category, taskQuery.data?.fund_id]
  );
  const application = applications.find((item) => item.task_id === taskId);

  const applyMutation = useMutation({
    mutationFn: (selectedTask: VolunteerTask) => applicationApi.apply(selectedTask.id),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось отправить отклик")
  });
  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!application) throw new Error("Отклик не найден");
      return applicationApi.cancel(application.id);
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось отменить отклик")
  });

  if (taskQuery.isLoading) {
    return <div className="h-[520px] animate-pulse rounded-[1.8rem] bg-white/70" />;
  }

  if (!task) {
    return (
      <section className="rounded-[1.35rem] bg-white p-8 text-center">
        <p className="text-2xl font-black">Задание не найдено</p>
      </section>
    );
  }

  const status: ApplicationStatus = application ? mapApplicationStatus(application.status) : "idle";

  return (
    <TaskDetailPage
      applicationError={error}
      applicationStatus={status}
      foundation={foundationFromTask(task)}
      isApplicationMutating={applyMutation.isPending || cancelMutation.isPending}
      onApply={async () => {
        await applyMutation.mutateAsync(task);
      }}
      onCancel={async () => {
        await cancelMutation.mutateAsync();
      }}
      onTaskOpen={() => undefined}
      related={related}
      task={task}
    />
  );
}
