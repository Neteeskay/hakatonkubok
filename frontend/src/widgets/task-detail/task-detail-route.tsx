"use client";

import { useEffect, useState } from "react";
import type { Foundation } from "@/entities/foundation/model";
import type { VolunteerTask } from "@/entities/task/model";
import { ApiError, getApiErrorMessage } from "@/shared/api/errors";
import { tasksService } from "@/shared/api/services/tasks";
import { TaskDetailPage } from "@/widgets/task-detail/task-detail-page";
import { mapTaskResponseToVolunteerTask, mapTaskToFoundation } from "@/widgets/volunteer-feed/task-api-mappers";

type TaskRouteState =
  | { error: null; foundation: Foundation; status: "ready"; task: VolunteerTask }
  | { error: string | null; foundation?: never; status: "error" | "loading" | "not-found"; task?: never };

export function TaskDetailRoute({ taskId }: { taskId: string }) {
  const [state, setState] = useState<TaskRouteState>({ error: null, status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadTask() {
      setState({ error: null, status: "loading" });

      try {
        const response = await tasksService.getTask(taskId);
        if (!active) return;

        const task = mapTaskResponseToVolunteerTask(response);
        setState({
          error: null,
          foundation: mapTaskToFoundation(task),
          status: "ready",
          task
        });
      } catch (error) {
        if (!active) return;

        if (error instanceof ApiError && error.status === 404) {
          setState({ error: null, status: "not-found" });
          return;
        }

        setState({ error: getApiErrorMessage(error), status: "error" });
      }
    }

    void loadTask();

    return () => {
      active = false;
    };
  }, [taskId]);

  if (state.status === "loading") {
    return <TaskDetailState title="Загрузка задания" text="Получаем актуальные данные задания." />;
  }

  if (state.status === "not-found") {
    return <TaskDetailState title="Задание не найдено" text="Возможно, оно было удалено или ещё не опубликовано." />;
  }

  if (state.status === "error") {
    return <TaskDetailState title="Не удалось загрузить задание" text={state.error ?? "Попробуйте обновить страницу."} />;
  }

  if (state.status === "ready") {
    return <TaskDetailPage foundation={state.foundation} related={[]} task={state.task} />;
  }

  return null;
}

function TaskDetailState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_24px_80px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Задание</p>
      <h1 className="mt-3 text-4xl font-black leading-tight">{title}</h1>
      <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-black/58">{text}</p>
    </div>
  );
}
