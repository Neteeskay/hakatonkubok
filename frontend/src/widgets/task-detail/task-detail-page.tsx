"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Repeat,
  Sparkles,
  type LucideIcon,
  UsersRound
} from "lucide-react";
import type { Foundation } from "@/entities/foundation/model";
import type { VolunteerTask } from "@/entities/task/model";
import { getRecruitmentState, recruitmentToneClass } from "@/widgets/volunteer-feed/model/recruitment-state";
import { categoryLabels, commitmentLabels, formatLabels, skillLabels, taskVisuals } from "@/widgets/volunteer-feed/task-dictionaries";
import {
  ctaLabels,
  getCtaState,
  getParticipationProgress,
  participationSteps,
  type ApplicationStatus
} from "@/widgets/task-detail/model/participation-flow";
import { DetailCard, DetailTitle, IconBubble, InfoTile, Pill } from "@/widgets/task-detail/ui/detail-card";
import { OrganizerCard } from "@/widgets/task-detail/ui/organizer-card";

export function TaskDetailPage({
  task,
  foundation,
  related,
  applicationStatus,
  onApplicationStatusChange,
  onTaskOpen,
  surface = "page"
}: {
  task: VolunteerTask;
  foundation: Foundation;
  related: VolunteerTask[];
  applicationStatus?: ApplicationStatus;
  onApplicationStatusChange?: (status: ApplicationStatus) => void;
  onTaskOpen?: (task: VolunteerTask) => void;
  surface?: "page" | "modal";
}) {
  const recruitment = getRecruitmentState(task);
  const [localStatus, setLocalStatus] = useState<ApplicationStatus>("idle");
  const currentStatus = applicationStatus ?? localStatus;
  const setStatus = onApplicationStatusChange ?? setLocalStatus;
  const ctaState = getCtaState(task.status, recruitment.remaining, currentStatus);
  const activeStep = getParticipationProgress(ctaState);
  const visual = taskVisuals[task.id] ?? taskVisuals["task-001"];
  const cta = ctaLabels[ctaState];
  const contactsUnlocked = ctaState === "accepted" || ctaState === "completed" || ctaState === "hours";

  function handleApply() {
    if (ctaState === "apply") setStatus("pending");
  }

  function handleCancel() {
    if (currentStatus === "pending" || currentStatus === "accepted") setStatus("idle");
  }

  return (
    <div className={surface === "modal" ? "space-y-5 pb-8" : "space-y-6"}>
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-5 shadow-[0_24px_80px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-7">
        <div className="absolute right-0 top-0 hidden h-full w-[46%] bg-cover bg-center md:block" style={{ backgroundImage: `url('${visual.image}')` }} />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-r from-white via-white/82 to-white/14 md:block" />
        <div className="absolute right-12 top-10 size-28 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_330px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="gold">{categoryLabels[task.category]}</Pill>
              <Pill tone={recruitment.tone === "open" ? "green" : recruitment.tone === "almost" ? "gold" : "red"}>{recruitment.label}</Pill>
              <Pill>{formatLabels[task.format]}</Pill>
              {task.proBono ? <Pill tone="violet">Pro Bono</Pill> : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.96] md:text-6xl">{task.title}</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-black/64">{task.description}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile icon={MapPin} label="Город" value={task.city} />
              <InfoTile icon={Calendar} label="Дата" value={task.date} />
              <InfoTile icon={Clock} label="Дедлайн" value={task.deadline} />
              <InfoTile icon={UsersRound} label="Места" value={`${task.filled}/${task.spots}`} accent />
            </div>
          </div>

          <aside className="rounded-[1.45rem] bg-[#fffdf7]/92 p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Участие</p>
            <p className="mt-3 text-5xl font-black">{task.hours} ч.</p>
            <p className="mt-2 text-sm font-bold leading-6 text-black/56">Начисляются только после подтверждения участия фондом и проверки.</p>
            <div className="mt-5 h-2 rounded-full bg-[#efeee8]"><div className="h-full rounded-full bg-brand" style={{ width: `${recruitment.progress}%` }} /></div>
            <div className="mt-3 flex justify-between text-xs font-bold text-black/48"><span>{recruitment.helper}</span><span>{recruitment.progress}%</span></div>
            <button
              onClick={handleApply}
              disabled={ctaState !== "apply"}
              className="mt-6 h-12 w-full rounded-2xl bg-brand text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] transition hover:-translate-y-0.5 disabled:bg-[#efeee8] disabled:text-black/38 disabled:shadow-none"
            >
              {cta.label}
            </button>
            {currentStatus === "pending" || currentStatus === "accepted" ? (
              <button onClick={handleCancel} className="mt-2 h-11 w-full rounded-2xl bg-white text-sm font-black text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
                Отменить отклик
              </button>
            ) : null}
            <p className="mt-3 text-center text-xs font-bold leading-5 text-black/46">{cta.helper}</p>
          </aside>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DetailCard>
            <DetailTitle title="Суть задания" />
            <div className="grid gap-4 md:grid-cols-3">
              <StoryBlock title="Что происходит" text={task.description} />
              <StoryBlock title="Зачем нужна помощь" text={task.impact} />
              <StoryBlock title="Польза участия" text="Вы закрываете конкретную задачу фонда и помогаете команде провести активность без лишней нагрузки." />
            </div>
          </DetailCard>

          <DetailCard>
            <DetailTitle title="Что нужно делать волонтёру" />
            <div className="grid gap-3 md:grid-cols-3">
              {task.instructions.map((item, index) => (
                <div key={item} className="rounded-[1.2rem] bg-[#fffdf7] p-4">
                  <span className="grid size-8 place-items-center rounded-xl bg-brand text-sm font-black">{index + 1}</span>
                  <p className="mt-4 text-sm font-bold leading-6 text-black/66">{item}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <DetailCard>
              <DetailTitle title="Требования к участникам" />
              <div className="space-y-3">
                {task.requirements.map((item) => (
                  <p key={item} className="flex gap-3 text-sm font-medium leading-6 text-black/64"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />{item}</p>
                ))}
              </div>
              {task.proBono ? (
                <div className="mt-5 rounded-[1.2rem] bg-[#f5f0ff] p-4">
                  <p className="text-sm font-black text-[#6b4de6]">Pro Bono навыки</p>
                  <div className="mt-3 flex flex-wrap gap-2">{task.skills.map((skill) => <Pill key={skill} tone="violet">{skillLabels[skill]}</Pill>)}</div>
                </div>
              ) : null}
            </DetailCard>

            <DetailCard>
              <DetailTitle title="Когда и где проходит" />
              <div className="grid gap-3">
                <InfoTile icon={MapPin} label="Место" value={task.location} />
                <InfoTile icon={Calendar} label="Дата и время" value={task.date} />
                <InfoTile icon={Repeat} label="Периодичность" value={commitmentLabels[task.commitment]} />
                <InfoTile icon={Link2} label="Формат" value={task.format === "online" ? "Онлайн: ссылка откроется после принятия" : "Офлайн: точка встречи после принятия"} />
              </div>
            </DetailCard>
          </div>

          <DetailCard>
            <DetailTitle title="Как происходит связь после отклика" />
            {contactsUnlocked ? (
              <div className="grid gap-4 md:grid-cols-3">
                <ContactStep icon={Mail} title="Email" text={`Письмо с деталями отправлено на корпоративную почту. Контакт фонда: ${task.contact.name}.`} />
                <ContactStep icon={MessageCircle} title="Чат и мессенджеры" text="Telegram/WhatsApp и рабочий чат доступны в уведомлениях и на странице отклика." />
                <ContactStep icon={Phone} title="Контакт фонда" text={`${task.contact.name}, ${task.contact.role}: ${task.contact.phone}`} />
              </div>
            ) : (
              <div className="rounded-[1.25rem] bg-[#fffdf7] p-5">
                <IconBubble icon={MessageCircle} className="bg-[#f4f3ee] text-black/42 shadow-none" />
                <p className="mt-4 text-lg font-black">Контакты откроются после принятия заявки</p>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-black/58">
                  После решения фонда здесь появятся email, телефон, Telegram/WhatsApp, ссылка на чат и инструкции по выполнению задания.
                </p>
              </div>
            )}
          </DetailCard>

          <DetailCard>
            <DetailTitle title="Статус участия и начисление часов" />
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {participationSteps.map((step, index) => {
                const active = index <= activeStep;
                return (
                  <div key={step.title} className={`rounded-[1.2rem] p-4 ${active ? "bg-brand/12" : "bg-[#fffdf7]"}`}>
                    <IconBubble icon={step.icon} className={active ? "" : "bg-[#f4f3ee] text-black/42 shadow-none"} />
                    <p className="mt-4 text-sm font-black leading-5">{step.title}</p>
                    <p className="mt-2 text-xs font-medium leading-5 text-black/52">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </DetailCard>

          <section>
            <h2 className="mb-4 text-2xl font-black">Похожие задания</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {related.map((item) => <RelatedTaskCard key={item.id} task={item} onOpen={onTaskOpen} />)}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
          <OrganizerCard foundation={foundation} />
          <DetailCard>
            <DetailTitle title="Коротко" />
            <div className="space-y-3">
              <InfoTile icon={Sparkles} label="Ожидаемый результат" value={task.impact} accent />
              <InfoTile icon={FileText} label="Материалы" value="Чек-лист, бренд-пакет и инструкции откроются после принятия" />
              <InfoTile icon={BadgeCheck} label="Проверка" value="Задание опубликовано после модерации администратора" />
            </div>
          </DetailCard>
        </aside>
      </div>
    </div>
  );
}

function StoryBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#fffdf7] p-4">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-black/58">{text}</p>
    </div>
  );
}

function ContactStep({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#fffdf7] p-4">
      <IconBubble icon={Icon} />
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-black/58">{text}</p>
    </div>
  );
}

function RelatedTaskCard({ task, onOpen }: { task: VolunteerTask; onOpen?: (task: VolunteerTask) => void }) {
  const recruitment = getRecruitmentState(task);
  const visual = taskVisuals[task.id] ?? taskVisuals["task-001"];
  const content = (
    <>
      <div className="relative h-32 overflow-hidden rounded-[1.05rem] bg-brand/12">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url('${visual.image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/8" />
        <span className="absolute left-3 top-3 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-black text-black">{visual.badge}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{categoryLabels[task.category]}</Pill>
        <span className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-black ${recruitmentToneClass(recruitment.tone)}`}>{recruitment.label}</span>
      </div>
      <h3 className="mt-3 text-xl font-black leading-tight">{task.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-black/56">{task.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm font-black text-black/58">
        <span>{task.hours} ч.</span>
        <span className="inline-flex items-center gap-1 text-black">
          Открыть
          <ArrowRight className="size-4" />
        </span>
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button onClick={() => onOpen(task)} className="group rounded-[1.25rem] bg-white p-3 text-left shadow-[0_16px_54px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(255,227,0,0.42)]">
        {content}
      </button>
    );
  }

  return (
    <Link href={`/volunteer/tasks/${task.id}`} className="group rounded-[1.25rem] bg-white p-3 shadow-[0_16px_54px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(255,227,0,0.42)]">
      {content}
    </Link>
  );
}
