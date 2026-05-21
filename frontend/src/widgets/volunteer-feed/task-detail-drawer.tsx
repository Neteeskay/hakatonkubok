"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { foundations, tasks } from "@/shared/config/mock-data";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";
import { TaskDetailPage } from "@/widgets/task-detail/task-detail-page";
import { mapTaskToFoundation } from "@/widgets/volunteer-feed/task-api-mappers";

export function TaskDetailDrawer({
  task,
  allTasks,
  status,
  applicationError,
  applicationSubmitting,
  onApply,
  onCancelApplication,
  onStatusChange,
  onClose,
  onTaskOpen
}: {
  task: VolunteerTask | null;
  allTasks?: VolunteerTask[];
  status: ApplicationStatus;
  applicationError?: string | null;
  applicationSubmitting?: boolean;
  onApply?: (task: VolunteerTask) => Promise<void> | void;
  onCancelApplication?: (task: VolunteerTask) => Promise<void> | void;
  onStatusChange: (status: ApplicationStatus) => void;
  onClose: () => void;
  onTaskOpen: (task: VolunteerTask) => void;
}) {
  const foundation = task ? foundations.find((item) => item.id === task.foundationId) ?? mapTaskToFoundation(task) : null;
  const relatedSource = allTasks?.length ? allTasks : tasks;
  const related = task
    ? relatedSource
        .filter((item) => item.id !== task.id && (item.category === task.category || item.foundationId === task.foundationId))
        .slice(0, 2)
    : [];

  return (
    <AnimatePresence>
      {task && foundation ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/18 p-2 backdrop-blur-sm md:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            className="relative mx-auto min-h-full w-full max-w-[1480px] rounded-[1.8rem] bg-[#fffdf7] p-3 shadow-[0_34px_110px_rgba(34,28,8,0.2)] md:p-5"
            initial={{ y: 28, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 22, scale: 0.985, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={task.title}
          >
            <div className="sticky top-2 z-30 mb-4 flex items-center justify-between gap-4 rounded-[1.25rem] bg-white/92 px-4 py-3 shadow-[0_16px_50px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] backdrop-blur-xl">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Подробное описание задания</p>
                <p className="truncate text-base font-black md:text-lg">{task.title}</p>
              </div>
              <button onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f4f3ee] text-black transition hover:bg-brand" aria-label="Закрыть описание задания">
                <X className="size-5" />
              </button>
            </div>

            <TaskDetailPage
              applicationStatus={status}
              applicationError={applicationError}
              applicationSubmitting={applicationSubmitting}
              foundation={foundation}
              onApply={onApply}
              onCancelApplication={onCancelApplication}
              onApplicationStatusChange={onStatusChange}
              onTaskOpen={onTaskOpen}
              related={related}
              surface="modal"
              task={task}
            />
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
