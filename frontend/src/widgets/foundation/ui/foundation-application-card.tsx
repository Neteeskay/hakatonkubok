"use client";

import { Check, CheckCircle2, Clock3, MessageCircle, X } from "lucide-react";
import { applicationStatusConfig, foundationToneStyles, type FoundationApplicationItem, type FoundationApplicationStatus } from "@/widgets/foundation/foundation-data";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";

export function FoundationApplicationCard({ item, onStatusChange }: { item: FoundationApplicationItem; onStatusChange?: (id: string, status: FoundationApplicationStatus) => void }) {
  const status = applicationStatusConfig[item.status];
  const styles = foundationToneStyles[status.tone];
  const Icon = status.icon;

  return (
    <article className="group overflow-hidden rounded-[1.55rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07),0_26px_70px_rgba(34,28,8,0.08)]">
      <div className="grid gap-0 xl:grid-cols-[1fr_300px]">
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-[1.35rem] bg-brand text-base font-black text-black shadow-[0_16px_32px_rgba(255,227,0,0.22)]">{initials(item.volunteer)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black leading-tight">{item.volunteer}</h2>
                  <FoundationStatusBadge tone={status.tone}>{status.label}</FoundationStatusBadge>
                </div>
                <p className="mt-1 text-sm font-bold text-black/50">{item.role} · {item.city}</p>
                <p className="mt-3 max-w-2xl text-sm font-black leading-6">{item.taskTitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <SmallStat value={`${item.hoursHistory} ч`} label="в истории" />
              <SmallStat value={`${item.completedActivities}`} label="участий" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/35">Навыки и интересы</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...item.skills, ...item.proBonoSkills, ...item.interests].map((skill) => (
                  <span key={skill} className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/58">{skill}</span>
                ))}
              </div>
            </div>
            <div className={`rounded-[1.15rem] p-4 ${styles.surface}`}>
              <Icon className={`size-5 ${styles.text}`} />
              <p className="mt-3 text-sm font-black">{status.helper}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-black/54">{item.comment}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[1.1rem] bg-[#fffdf7] px-4 py-3">
            <Clock3 className="size-4 text-black/50" />
            <p className="text-xs font-bold leading-5 text-black/56">{item.nextStep}</p>
          </div>
        </div>

        <aside className="bg-[#fffdf7] p-5 md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Действие фонда</p>
            <div className="mt-4 grid gap-2">
              <button onClick={() => onStatusChange?.(item.id, "accepted")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-xs font-black text-black transition hover:brightness-95">
                <Check className="size-4" />
                Принять заявку
              </button>
              <button onClick={() => onStatusChange?.(item.id, "clarify")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-black/66 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-[#f7f4ff]">
                <MessageCircle className="size-4" />
                Запросить уточнение
              </button>
              <button onClick={() => onStatusChange?.(item.id, "rejected")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-[#c83c3c] shadow-[inset_0_0_0_1px_rgba(200,60,60,0.18)] transition hover:bg-[#fff6f6]">
                <X className="size-4" />
                Отклонить
              </button>
            </div>
          </div>
          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Подтверждение</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => onStatusChange?.(item.id, "completed")} className="h-10 rounded-xl bg-white text-[11px] font-black text-[#247a31] shadow-[inset_0_0_0_1px_rgba(36,122,49,0.16)] transition hover:bg-[#e8f8eb]">Участвовал</button>
              <button onClick={() => onStatusChange?.(item.id, "rejected")} className="h-10 rounded-xl bg-white text-[11px] font-black text-[#c83c3c] shadow-[inset_0_0_0_1px_rgba(200,60,60,0.16)] transition hover:bg-[#fff1f1]">Не участвовал</button>
              <button onClick={() => onStatusChange?.(item.id, "confirmed")} className="h-10 rounded-xl bg-white text-[11px] font-black text-[#247a31] shadow-[inset_0_0_0_1px_rgba(36,122,49,0.16)] transition hover:bg-[#e8f8eb]">Выполнил</button>
              <button onClick={() => onStatusChange?.(item.id, "rejected")} className="h-10 rounded-xl bg-white text-[11px] font-black text-[#c83c3c] shadow-[inset_0_0_0_1px_rgba(200,60,60,0.16)] transition hover:bg-[#fff1f1]">Не выполнил</button>
            </div>
            <button onClick={() => onStatusChange?.(item.id, "confirmed")} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e8f8eb] text-xs font-black text-[#247a31] transition hover:brightness-95">
              <CheckCircle2 className="size-4" />
              Подтвердить участие
            </button>
          </div>
        </aside>
      </div>
    </article>
  );
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-20 rounded-xl bg-[#fffdf7] px-3 py-2">
      <p className="text-sm font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-black text-black/38">{label}</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
