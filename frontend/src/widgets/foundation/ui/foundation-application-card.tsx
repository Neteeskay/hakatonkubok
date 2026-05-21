"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Link2,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  X,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  applicationStatusConfig,
  foundationToneStyles,
  type FoundationApplicationItem,
  type FoundationApplicationStatus,
  type FoundationTaskItem
} from "@/widgets/foundation/foundation-data";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";

<<<<<<< Updated upstream
export function FoundationApplicationCard({ item, onStatusChange }: { item: FoundationApplicationItem; onStatusChange?: (id: string, status: FoundationApplicationStatus) => Promise<void> | void }) {
=======
type CommentAction = Extract<FoundationApplicationStatus, "rejected" | "not_completed">;

export function FoundationApplicationCard({
  item,
  task,
  onStatusChange
}: {
  item: FoundationApplicationItem;
  task: FoundationTaskItem;
  onStatusChange?: (id: string, status: FoundationApplicationStatus, comment?: string) => void;
}) {
  const [commentAction, setCommentAction] = useState<CommentAction | null>(null);
  const [comment, setComment] = useState("");
>>>>>>> Stashed changes
  const status = applicationStatusConfig[item.status];
  const styles = foundationToneStyles[status.tone];
  const Icon = status.icon;
  const contactsUnlocked = task.contactVisibility === "immediate" || ["accepted", "completed", "confirmed"].includes(item.status);
  const isClosed = item.status === "rejected" || item.status === "confirmed" || item.status === "not_completed";

  function submitComment() {
    if (!commentAction) return;
    onStatusChange?.(item.id, commentAction, comment);
    setComment("");
    setCommentAction(null);
  }

  return (
    <article className="group overflow-hidden rounded-[1.55rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07),0_26px_70px_rgba(34,28,8,0.08)]">
      <div className="grid gap-0 xl:grid-cols-[1fr_330px]">
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 gap-4">
              <span className="relative grid size-[4.6rem] shrink-0 place-items-center rounded-[1.45rem] bg-brand text-lg font-black text-black shadow-[0_18px_38px_rgba(255,227,0,0.24)]">
                {initials(item.volunteer)}
                <span className={cn("absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border-4 border-white", styles.icon)}>
                  <Icon className="size-4" />
                </span>
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black leading-tight">{item.volunteer}</h2>
                  <FoundationStatusBadge tone={status.tone}>{status.label}</FoundationStatusBadge>
                </div>
                <p className="mt-1 text-sm font-bold text-black/50">{item.role} · {item.city}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-black/50">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffdf7] px-3 py-1.5"><CalendarClock className="size-3.5" />Отклик {item.appliedAt}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffdf7] px-3 py-1.5"><Star className="size-3.5" />{item.relevance}% совпадение</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <SmallStat value={`${item.hoursHistory} ч`} label="в истории" />
              <SmallStat value={`${item.completedActivities}`} label="участий" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.82fr]">
            <div className="rounded-[1.2rem] bg-[#fffdf7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/35">Навыки и интересы</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...item.skills, ...item.proBonoSkills, ...item.interests].map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-black/58 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.05)]">{skill}</span>
                ))}
              </div>
            </div>

            <div className={cn("rounded-[1.2rem] p-4", styles.surface)}>
              <div className="flex items-start gap-3">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", styles.icon)}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black">{status.helper}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-black/54">{item.comment}</p>
                </div>
              </div>
            </div>
          </div>

          <ContactAccessPanel contactsUnlocked={contactsUnlocked} task={task} />

          {commentAction ? (
            <div className="mt-4 rounded-[1.2rem] bg-[#fffdf7] p-4">
              <p className="text-sm font-black">{commentAction === "rejected" ? "Причина отказа" : "Комментарий по невыполнению"}</p>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={commentAction === "rejected" ? "Например: лимит участников уже достигнут" : "Напишите коротко и понятно"}
                className="mt-3 min-h-24 w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/28 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]"
              />
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button onClick={() => setCommentAction(null)} className="h-10 rounded-xl bg-white px-4 text-xs font-black text-black/55 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]">Отмена</button>
                <button onClick={submitComment} className="h-10 rounded-xl bg-brand px-4 text-xs font-black text-black">Сохранить статус</button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col justify-between bg-[#fffdf7] p-5 md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Что сделать сейчас</p>
            <p className="mt-2 text-sm font-bold leading-6 text-black/52">{item.nextStep}</p>
          </div>

          <div className="mt-5 space-y-3">
            {!isClosed && (item.status === "review" || item.status === "clarify") ? (
              <>
                <button onClick={() => onStatusChange?.(item.id, "accepted")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e8f8eb] text-xs font-black text-[#247a31] transition hover:brightness-95">
                  <Check className="size-4" />
                  Подтвердить участие
                </button>
                <button onClick={() => setCommentAction("rejected")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-[#c83c3c] shadow-[inset_0_0_0_1px_rgba(200,60,60,0.18)] transition hover:bg-[#fff6f6]">
                  <X className="size-4" />
                  Отклонить
                </button>
              </>
            ) : null}

            {!isClosed && (item.status === "accepted" || item.status === "completed") ? (
              <>
                <button onClick={() => onStatusChange?.(item.id, "confirmed")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e8f8eb] text-xs font-black text-[#247a31] transition hover:brightness-95">
                  <CheckCircle2 className="size-4" />
                  Подтвердить выполнение
                </button>
                <button onClick={() => setCommentAction("not_completed")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-[#c83c3c] shadow-[inset_0_0_0_1px_rgba(200,60,60,0.18)] transition hover:bg-[#fff6f6]">
                  <XCircle className="size-4" />
                  Не выполнено
                </button>
              </>
            ) : null}

            {isClosed ? (
              <div className={cn("rounded-[1.15rem] p-4", styles.surface)}>
                <ShieldCheck className={cn("size-5", styles.text)} />
                <p className="mt-3 text-sm font-black">{item.status === "confirmed" ? "Решение фонда зафиксировано" : "Заявка закрыта"}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-black/52">Информация сохранена в истории участия.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </article>
  );
}

function ContactAccessPanel({ contactsUnlocked, task }: { contactsUnlocked: boolean; task: FoundationTaskItem }) {
  if (!contactsUnlocked) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-[1.2rem] bg-[#fbfaf4] px-4 py-3">
        <Clock3 className="mt-0.5 size-4 shrink-0 text-black/46" />
        <p className="text-xs font-bold leading-5 text-black/54">Организационная информация появится у волонтёра после подтверждения участия фондом.</p>
      </div>
    );
  }

  const contacts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Send, label: "Telegram", value: task.contacts.telegram },
    { icon: Smartphone, label: "WhatsApp", value: task.contacts.whatsapp },
    { icon: Phone, label: "Телефон", value: task.contacts.phone },
    { icon: Mail, label: "Email", value: task.contacts.email },
    { icon: Link2, label: "Чат", value: task.contacts.chatLink }
  ].filter((contact) => contact.value);

  return (
    <div className="mt-4 rounded-[1.2rem] bg-[#f0fbf1] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#247a31]">Контакты доступны волонтёру</p>
        <ChevronRight className="size-4 text-[#247a31]" />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {contacts.map((contact) => {
          const ContactIcon = contact.icon;
          return (
            <span key={contact.label} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-black/60">
              <ContactIcon className="size-4 text-black" />
              {contact.label}: {contact.value}
            </span>
          );
        })}
      </div>
      {task.contacts.instruction ? <p className="mt-3 text-xs font-bold leading-5 text-black/54">{task.contacts.instruction}</p> : null}
    </div>
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
