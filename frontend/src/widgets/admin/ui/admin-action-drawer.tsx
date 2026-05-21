"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, X } from "lucide-react";

export function AdminActionDrawer({
  title,
  text,
  commentPlaceholder,
  approveLabel = "Одобрить",
  revisionLabel = "Вернуть на доработку",
  rejectLabel = "Отклонить",
  onClose,
  onApprove,
  onRevision,
  onReject
}: {
  title: string;
  text: string;
  commentPlaceholder?: string;
  approveLabel?: string;
  revisionLabel?: string;
  rejectLabel?: string;
  onClose: () => void;
  onApprove: () => void;
  onRevision: (comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/18 p-3 backdrop-blur-sm md:p-6">
      <div className="ml-auto flex h-full max-w-[560px] flex-col overflow-hidden rounded-[1.8rem] bg-white shadow-[0_30px_110px_rgba(34,28,8,0.22)]">
        <div className="flex items-start justify-between gap-4 bg-[#fffdf7] p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/36">Решение администратора</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-black/52">{text}</p>
          </div>
          <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black/60">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <label>
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-black/36">
              <MessageCircle className="size-4" />
              Комментарий
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={commentPlaceholder ?? "Напишите понятный комментарий для фонда"}
              className="mt-3 min-h-40 w-full resize-none rounded-[1.35rem] bg-[#fffdf7] px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/30 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]"
            />
          </label>
          <div className="mt-5 rounded-[1.25rem] bg-brand/12 p-4">
            <p className="text-sm font-black">Комментарий увидит фонд</p>
            <p className="mt-1 text-xs font-bold leading-5 text-black/48">При доработке или отказе текст появится в карточке задания или профиле фонда.</p>
          </div>
        </div>
        <div className="grid gap-2 border-t border-black/5 p-5">
          <button onClick={onApprove} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-black">
            <CheckCircle2 className="size-4" />
            {approveLabel}
          </button>
          <button onClick={() => onRevision(comment || "Уточните данные и отправьте заявку повторно.")} className="h-12 rounded-xl bg-[#fff6df] text-sm font-black text-[#9b5a00]">{revisionLabel}</button>
          <button onClick={() => onReject(comment || "Заявка не соответствует требованиям платформы.")} className="h-12 rounded-xl bg-[#fff1f1] text-sm font-black text-[#c83c3c]">{rejectLabel}</button>
        </div>
      </div>
    </div>
  );
}
