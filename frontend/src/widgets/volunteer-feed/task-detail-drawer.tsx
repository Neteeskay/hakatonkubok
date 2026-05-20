"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, Clock, MapPin, Phone, UsersRound, X, type LucideIcon } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { categoryLabels, commitmentLabels, formatLabels, skillLabels, taskStatusLabels } from "@/widgets/volunteer-feed/task-dictionaries";

type ApplicationStatus = "idle" | "pending" | "accepted" | "rejected" | "completed" | "hours";

const statusText: Record<ApplicationStatus, string> = {
  idle: "Можно откликнуться",
  pending: "На рассмотрении",
  accepted: "Принят",
  rejected: "Отклонён",
  completed: "Завершено",
  hours: "Часы подтверждены"
};

export function TaskDetailDrawer({
  task,
  status,
  onApply,
  onCancel,
  onClose
}: {
  task: VolunteerTask | null;
  status: ApplicationStatus;
  onApply: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {task ? (
        <motion.div className="fixed inset-0 z-50 bg-black/18 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            className="ml-auto h-full w-full max-w-[760px] overflow-y-auto rounded-l-[2rem] bg-[#fffdf7] shadow-[0_30px_90px_rgba(34,28,8,0.18)]"
            initial={{ x: 90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={task.title}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[#fffdf7]/92 px-6 py-5 backdrop-blur-xl">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/42">{categoryLabels[task.category]}</p>
                <h2 className="mt-1 max-w-xl text-2xl font-black md:text-3xl">{task.title}</h2>
              </div>
              <button onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]" aria-label="Закрыть">
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 pb-8">
              <div className="rounded-[1.45rem] bg-white p-5 shadow-[0_18px_60px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)]">
                <div className="flex flex-wrap gap-2">
                  <Badge>{taskStatusLabels[task.status]}</Badge>
                  <Badge>{formatLabels[task.format]}</Badge>
                  <Badge>{commitmentLabels[task.commitment]}</Badge>
                  {task.proBono ? <Badge>Pro bono</Badge> : null}
                  <Badge>{statusText[status]}</Badge>
                </div>
                <p className="mt-5 text-[16px] leading-7 text-black/68">{task.description}</p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <Info icon={MapPin} label="Город и место" value={`${task.city} · ${task.location}`} />
                  <Info icon={Calendar} label="Дата и дедлайн" value={`${task.date} · ${task.deadline}`} />
                  <Info icon={UsersRound} label="Участники" value={`${task.filled} откликнулись · ${task.spots} мест всего`} />
                  <Info icon={Clock} label="Часы" value={`${task.hours} часов после подтверждения`} />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Section title="Требования">
                  {task.requirements.map((item) => <Checklist key={item}>{item}</Checklist>)}
                </Section>
                <Section title="Инструкции">
                  {task.instructions.map((item) => <Checklist key={item}>{item}</Checklist>)}
                </Section>
              </div>

              <Section title="Ожидаемый результат" className="mt-5">
                <p className="text-sm leading-6 text-black/62">{task.impact}</p>
              </Section>

              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_0.8fr]">
                <Section title="Материалы и связь">
                  <Checklist>Материалы откроются после принятия отклика.</Checklist>
                  <Checklist>Формат связи: координатор фонда напишет в течение 1 рабочего дня.</Checklist>
                  <p className="mt-4 flex items-center gap-2 text-sm font-bold text-black/72"><Phone className="size-4" />{task.contact.name}, {task.contact.role}</p>
                </Section>
                <Section title="Flow часов">
                  {["Отклик", "Решение фонда", "Подтверждение участия", "Начисление часов"].map((step, index) => (
                    <div key={step} className="flex items-center gap-3 py-2 text-sm font-bold text-black/68">
                      <span className="grid size-7 place-items-center rounded-full bg-brand text-xs text-black">{index + 1}</span>
                      {step}
                    </div>
                  ))}
                </Section>
              </div>

              <div className="sticky bottom-0 mt-6 rounded-[1.35rem] bg-white/94 p-4 shadow-[0_-16px_46px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/38">Текущий статус</p>
                    <p className="text-lg font-black">{statusText[status]}</p>
                  </div>
                  <div className="flex gap-2">
                    {status === "idle" ? (
                      <button onClick={onApply} className="h-12 rounded-xl bg-brand px-6 text-sm font-black text-black shadow-[0_14px_32px_rgba(255,204,0,0.28)]">Откликнуться</button>
                    ) : (
                      <button onClick={onCancel} className="h-12 rounded-xl bg-white px-6 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.1)]">Отменить отклик</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#fff4ba] px-3 py-1.5 text-xs font-black text-black">{children}</span>;
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf4] p-4">
      <Icon className="size-5 text-black/54" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-black/72">{value}</p>
    </div>
  );
}

function Section({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-[1.35rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] ${className ?? ""}`}>
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Checklist({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-3 text-sm leading-6 text-black/64">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8ae00]" />
      {children}
    </p>
  );
}
