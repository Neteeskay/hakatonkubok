"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  UserCheck,
  UserRound,
  XCircle
} from "lucide-react";
import {
  adminFoundations,
  foundationStatusConfig,
  taskStatusConfig,
  type AdminFoundation,
  type AdminFoundationStatus,
  type AdminTask,
  type AdminTaskStatus
} from "@/widgets/admin/admin-data";
import { AdminStatusBadge } from "@/widgets/admin/ui/admin-status-badge";

type DecisionPanelProps = {
  commentPlaceholder: string;
  approveLabel: string;
  revisionLabel: string;
  rejectLabel: string;
  onApprove: () => void;
  onRevision: (comment: string) => void;
  onReject: (comment: string) => void;
};

export function FoundationReviewPanel({
  foundation,
  onApprove,
  onRevision,
  onReject
}: {
  foundation: AdminFoundation;
  onApprove: () => void;
  onRevision: (comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const status = foundationStatusConfig[foundation.status];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.55rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand/24 blur-3xl" />
        <div className="pointer-events-none absolute bottom-5 left-1/2 hidden h-24 w-64 -translate-x-1/2 rounded-full bg-brand/14 blur-3xl md:block" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-35 md:block" style={{ backgroundImage: `url(${foundation.cover ?? foundation.logo})` }} />
        <div className="relative z-10 grid gap-5 md:grid-cols-[104px_1fr_auto] md:items-start">
          <div className="relative size-24 overflow-hidden rounded-[1.45rem] bg-white shadow-[0_16px_38px_rgba(34,28,8,0.08)]">
            <Image src={foundation.logo} alt={foundation.name} fill sizes="96px" className="object-cover" />
          </div>
          <div>
            <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
            <h3 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-black">{foundation.name}</h3>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-black/58">{foundation.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {foundation.categories.map((category) => <Chip key={category}>{category}</Chip>)}
            </div>
          </div>
          <Link href={`/preview/foundations/${foundation.id}`} target="_blank" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black">
            Preview
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <InfoSection title="Основная информация" icon={Building2}>
          <InfoGrid
            items={[
              ["Регион", foundation.region],
              ["Сайт", foundation.website],
              ["Соцсети", foundation.socials],
              ["Дата регистрации", foundation.registeredAt]
            ]}
          />
          <TextBlock title="Планируемые активности" items={foundation.plannedActivities} />
        </InfoSection>
        <InfoSection title="Контакты" icon={UserRound}>
          <ContactLine icon={UserRound} label="Контактное лицо" value={`${foundation.contactName}, ${foundation.contactRole}`} />
          <ContactLine icon={Mail} label="Email" value={foundation.email} />
          <ContactLine icon={Phone} label="Телефон" value={foundation.phone} />
          {foundation.telegram ? <ContactLine icon={MessageCircle} label="Telegram" value={foundation.telegram} /> : null}
          {foundation.whatsapp ? <ContactLine icon={MessageCircle} label="WhatsApp" value={foundation.whatsapp} /> : null}
        </InfoSection>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <InfoSection title="Юридическая информация" icon={ShieldCheck}>
          <InfoGrid
            items={[
              ["ИНН", foundation.inn],
              ["ОГРН", foundation.ogrn],
              ["Юридический адрес", foundation.legalAddress ?? "Не указан"]
            ]}
          />
        </InfoSection>
        <InfoSection title="Файлы для проверки" icon={FileText}>
          <p className="-mt-1 text-sm font-bold leading-6 text-black/52">
            Фонд приложил документы к заявке. Нажмите на карточку документа, чтобы открыть файл для просмотра.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {foundation.documents.map((document) => <DocumentCard key={document.fileName} title={document.title} fileName={document.fileName} status={document.status} />)}
          </div>
        </InfoSection>
      </section>

      {foundation.adminComment ? (
        <div className="rounded-[1.3rem] bg-[#fff5e4] p-4 text-sm font-bold leading-6 text-[#9b5a00]">
          Комментарий администратора: {foundation.adminComment}
        </div>
      ) : null}

      <AdminDecisionPanel
        commentPlaceholder="Например: приложите актуальную выписку и подтвердите связь контактного лица с фондом."
        approveLabel="Одобрить фонд"
        revisionLabel="Отправить на доработку"
        rejectLabel="Отклонить"
        onApprove={onApprove}
        onRevision={onRevision}
        onReject={onReject}
      />
    </div>
  );
}

export function TaskReviewPanel({
  task,
  onApprove,
  onRevision,
  onReject
}: {
  task: AdminTask;
  onApprove: () => void;
  onRevision: (comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const status = taskStatusConfig[task.status];
  const foundation = adminFoundations.find((item) => item.id === task.foundationId);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 rounded-[1.55rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] lg:grid-cols-[360px_1fr]">
        <div className="relative min-h-[260px] overflow-hidden rounded-[1.35rem] bg-[#fffdf7]">
          <Image src={task.image} alt={task.title} fill sizes="360px" className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
            {task.proBono ? <AdminStatusBadge tone="done">Pro bono</AdminStatusBadge> : null}
          </div>
        </div>
        <div className="py-1">
          <p className="text-sm font-black text-black/42">{task.foundation} · {task.category}</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-black">{task.title}</h3>
          <p className="mt-3 text-sm font-bold leading-6 text-black/58">{task.description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <MiniFact label="Формат" value={task.format} />
            <MiniFact label="Дедлайн" value={task.deadline} />
            <MiniFact label="Места" value={`${task.filled}/${task.spots}`} />
            <MiniFact label="Часы" value={`${task.hours} ч`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoSection title="Суть задания" icon={CheckCircle2}>
          <DetailText title="Цель" text={task.goal} />
          <TextBlock title="Что делает волонтёр" items={task.volunteerActions} />
        </InfoSection>
        <InfoSection title="Условия участия" icon={MapPin}>
          <InfoGrid
            items={[
              ["Город / локация", `${task.city} · ${task.location}`],
              ["Периодичность", task.period],
              ["Связь после отклика", task.communication],
              ["Контакты", task.contacts]
            ]}
          />
        </InfoSection>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <InfoSection title="Требования и материалы" icon={FileText}>
          <TextBlock title="Требования" items={task.requirements} />
          <TextBlock title="Материалы" items={task.materials} />
          <DetailText title="Инструкция" text={task.instruction} />
        </InfoSection>
        {foundation ? <FoundationMiniCard foundation={foundation} /> : null}
      </section>

      {task.moderatorComment ? (
        <div className="rounded-[1.3rem] bg-[#fff5e4] p-4 text-sm font-bold leading-6 text-[#9b5a00]">
          Комментарий для фонда: {task.moderatorComment}
        </div>
      ) : null}

      <AdminDecisionPanel
        commentPlaceholder="Например: уточните адрес, контакт после принятия и формат материалов."
        approveLabel="Одобрить"
        revisionLabel="Отправить на доработку"
        rejectLabel="Отклонить"
        onApprove={onApprove}
        onRevision={onRevision}
        onReject={onReject}
      />
    </div>
  );
}

export function AdminDecisionPanel({
  commentPlaceholder,
  approveLabel,
  revisionLabel,
  rejectLabel,
  onApprove,
  onRevision,
  onReject
}: DecisionPanelProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function requireComment(action: (comment: string) => void) {
    if (!comment.trim()) {
      setError("Для доработки или отказа нужен понятный комментарий.");
      return;
    }
    action(comment.trim());
  }

  return (
    <section className="rounded-[1.55rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <label>
        <span className="text-sm font-black text-black">Комментарий администратора</span>
        <textarea
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError("");
          }}
          placeholder={commentPlaceholder}
          className="mt-3 min-h-32 w-full resize-none rounded-[1.25rem] bg-white px-4 py-3 text-sm font-bold leading-6 text-black outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/28 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.9)]"
        />
      </label>
      {error ? <p className="mt-2 text-sm font-black text-[#c83c3c]">{error}</p> : null}
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <button onClick={onApprove} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e1f7e5] text-sm font-black text-[#247a31] transition hover:-translate-y-0.5">
          <CheckCircle2 className="size-4" />
          {approveLabel}
        </button>
        <button onClick={() => requireComment(onRevision)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#fff0d8] text-sm font-black text-[#9b5a00] transition hover:-translate-y-0.5">
          <Send className="size-4" />
          {revisionLabel}
        </button>
        <button onClick={() => requireComment(onReject)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ffe8e8] text-sm font-black text-[#c83c3c] transition hover:-translate-y-0.5">
          <XCircle className="size-4" />
          {rejectLabel}
        </button>
      </div>
    </section>
  );
}

function FoundationMiniCard({ foundation }: { foundation: AdminFoundation }) {
  return (
    <Link href={`/preview/foundations/${foundation.id}`} target="_blank" className="group block rounded-[1.55rem] bg-[#fffdf7] p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(34,28,8,0.07)]">
      <div className="flex gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[1.15rem] bg-white">
          <Image src={foundation.logo} alt={foundation.name} fill sizes="64px" className="object-cover" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">Фонд-организатор</p>
          <h3 className="mt-1 text-xl font-black leading-tight text-black">{foundation.name}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-black/52">{foundation.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {foundation.categories.map((category) => <Chip key={category}>{category}</Chip>)}
        <Chip>{foundation.region}</Chip>
      </div>
    </Link>
  );
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: ReactNode }) {
  return (
    <section className="rounded-[1.55rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand/18 text-black">
          <Icon className="size-5" />
        </span>
        <h3 className="text-xl font-black text-black">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => <MiniFact key={label} label={label} value={value} />)}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] bg-[#fffdf7] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-black/70">{value}</p>
    </div>
  );
}

function DetailText({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-black text-black">{title}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-black/56">{text}</p>
    </div>
  );
}

function TextBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-black">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <Chip key={item}>{item}</Chip>)}
      </div>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-xs font-black text-black/56">{children}</span>;
}

function ContactLine({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-[1.1rem] bg-[#fffdf7] p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-black/42" />
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
        <p className="mt-1 text-sm font-black leading-5 text-black/70">{value}</p>
      </div>
    </div>
  );
}

const documentMeta = [
  {
    match: ["регистрац"],
    title: "Документ о регистрации организации",
    description: "Подтверждение регистрации фонда",
    icon: BadgeCheck,
    accent: "bg-brand/22 text-black"
  },
  {
    match: ["устав", "учред"],
    title: "Устав организации",
    description: "Учредительный документ фонда",
    icon: Landmark,
    accent: "bg-[#e9efff] text-[#315ed1]"
  },
  {
    match: ["выписк", "реестр"],
    title: "Выписка из реестра",
    description: "Актуальные сведения из реестра",
    icon: Database,
    accent: "bg-[#e6f8e9] text-[#247a31]"
  },
  {
    match: ["контакт", "связ", "довер", "authorization"],
    title: "Подтверждение связи контактного лица",
    description: "Документ, подтверждающий полномочия контактного лица",
    icon: UserCheck,
    accent: "bg-[#eee9ff] text-[#6b4de6]"
  }
];

function DocumentCard({ title, fileName, status }: { title: string; fileName: string; status: AdminFoundation["documents"][number]["status"] }) {
  const normalized = `${title} ${fileName}`.toLowerCase();
  const meta = documentMeta.find((item) => item.match.some((part) => normalized.includes(part))) ?? {
    title,
    description: "Дополнительный документ фонда",
    icon: Paperclip,
    accent: "bg-[#f4f3ee] text-black/62"
  };
  const Icon = meta.icon;
  const fileSize = fileName.includes("scan") ? "1.8 МБ" : fileName.includes("charter") ? "2.4 МБ" : "1.2 МБ";
  const statusLabel = status === "replace" ? "Нужна замена" : "Приложен";
  const statusClass = status === "replace" ? "bg-[#fff0d8] text-[#9b5a00]" : "bg-[#e8f8eb] text-[#247a31]";

  return (
    <a
      href={`/documents/${encodeURIComponent(fileName)}`}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-[1.25rem] bg-[#fffdf7] p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_16px_40px_rgba(34,28,8,0.045)] transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[inset_0_0_0_1px_rgba(255,227,0,0.42),0_22px_58px_rgba(34,28,8,0.075)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-brand/16 blur-2xl transition group-hover:bg-brand/24" />
      <div className="relative flex items-start gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-[0_12px_28px_rgba(34,28,8,0.06)] ${meta.accent}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 pr-7">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black leading-5 text-black">{meta.title}</h4>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClass}`}>{statusLabel}</span>
          </div>
          <p className="mt-1 text-xs font-bold leading-5 text-black/48">{meta.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="max-w-full truncate rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-black/58 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">{fileName}</span>
            <span className="text-[11px] font-bold text-black/36">{fileSize}</span>
          </div>
        </div>
        <span className="absolute right-0 top-0 grid size-9 place-items-center rounded-xl bg-white text-black/44 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] transition group-hover:bg-brand group-hover:text-black">
          <ExternalLink className="size-4" />
        </span>
      </div>
    </a>
  );
}
