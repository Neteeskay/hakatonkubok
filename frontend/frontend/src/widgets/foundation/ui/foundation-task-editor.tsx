"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import type { FoundationTaskItem } from "@/widgets/foundation/foundation-data";
import { CreateTaskForm } from "@/widgets/foundation/ui/create-task-form";

export function FoundationTaskEditor({
  task,
  onClose,
  onSave
}: {
  task: FoundationTaskItem;
  onClose: () => void;
  onSave: (updates: Partial<FoundationTaskItem>) => void;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/20 p-3 backdrop-blur-sm md:p-6">
      <div className="ml-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[1.7rem] bg-[#fffdf7] shadow-[0_30px_100px_rgba(0,0,0,0.22)]">
        <header className="flex items-start justify-between gap-5 bg-white px-5 py-5 shadow-[inset_0_-1px_0_rgba(24,20,7,0.06)] md:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">Редактирование задания</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">{task.title}</h2>
            {task.moderationComment ? (
              <p className="mt-3 max-w-2xl rounded-xl bg-[#f7f4ff] px-4 py-3 text-sm font-bold leading-6 text-[#6b4de6]">{task.moderationComment}</p>
            ) : null}
          </div>
          <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fffdf7] text-black transition hover:bg-brand/20" aria-label="Закрыть редактирование">
            <X className="size-5" />
          </button>
        </header>

        {saved ? (
          <section className="m-5 rounded-[1.4rem] bg-[#e8f8eb] p-5 text-[#247a31] md:m-7">
            <CheckCircle2 className="size-7" />
            <h3 className="mt-3 text-2xl font-black">Изменения сохранены</h3>
            <p className="mt-2 text-sm font-bold leading-6">Задание повторно отправлено на модерацию.</p>
          </section>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto p-5 md:p-7">
          <CreateTaskForm
            initialTask={task}
            submitLabel="Сохранить и отправить"
            onSubmit={(updates) => {
              onSave(updates);
              setSaved(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
