import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import type { Foundation } from "@/entities/foundation/model";
import type { VolunteerTask } from "@/entities/task/model";
import { FoundationActivityCard } from "@/widgets/foundation-public/ui/foundation-activity-card";
import { FoundationStat } from "@/widgets/foundation-public/ui/foundation-stat";
import { DetailCard, IconBubble, Pill } from "@/widgets/task-detail/ui/detail-card";

export interface FoundationPublicDetails {
  verified: boolean;
  logo: string;
  description: string;
  site: string;
  icons: LucideIcon[];
  mission: string;
  activityTypes: string[];
  categories: string[];
  email: string;
  phone: string;
  inn: string;
}

export function FoundationPublicPage({
  foundation,
  activeTasks,
  completedTasks,
  details = buildFoundationDetails(foundation, activeTasks)
}: {
  foundation: Foundation;
  activeTasks: VolunteerTask[];
  completedTasks: VolunteerTask[];
  details?: FoundationPublicDetails;
}) {
  const totalHours = [...activeTasks, ...completedTasks].reduce((sum, task) => sum + task.hours * Math.max(task.filled, 1), foundation.reportsReady * 18);
  const volunteers = [...activeTasks, ...completedTasks].reduce((sum, task) => sum + task.filled, foundation.volunteersNeeded);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-5 shadow-[0_24px_80px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-7">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/28 blur-3xl" />
        <div className="absolute bottom-0 right-0 hidden h-[70%] w-[52%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-95 md:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[60%] bg-gradient-to-r from-white via-white/92 to-white/28 md:block" />
        <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_360px]">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill tone={details.verified ? "green" : "gold"}>{details.verified ? "Проверенный фонд" : "Фонд на проверке"}</Pill>
              <Pill>{foundation.city}</Pill>
              <Pill tone="gold">Публичная страница</Pill>
            </div>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid size-24 shrink-0 place-items-center rounded-[1.6rem] bg-brand text-3xl font-black text-black shadow-[0_18px_46px_rgba(255,227,0,0.28)]">
                {details.logo}
              </div>
              <div>
                <h1 className="text-5xl font-black leading-[0.98] md:text-6xl">{foundation.name}</h1>
                <p className="mt-3 max-w-2xl text-lg font-medium leading-8 text-black/62">{details.description}</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#active-tasks" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.26)] transition hover:-translate-y-0.5">
                Смотреть задания
                <ArrowRight className="size-4" />
              </Link>
              <a href={`https://${details.site}`} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#fffdf7] px-6 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
                Сайт фонда
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <aside className="rounded-[1.45rem] bg-[#fffdf7]/94 p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Доверие</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {details.icons.map((Icon, index) => (
                <span key={`${foundation.id}-icon-${index}`} className="grid aspect-square place-items-center rounded-[1.15rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
                  <Icon className="size-6 text-brand" />
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-3 text-sm font-bold text-black/58">
              <p className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#247a31]" />Верифицированный профиль организации</p>
              <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand" />Задания проходят модерацию перед публикацией</p>
              <p className="flex items-center gap-2"><MapPin className="size-4 text-black/42" />{foundation.city}</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FoundationStat icon={Target} label="задания" value={`${activeTasks.length + completedTasks.length}`} caption="опубликовано на платформе" />
        <FoundationStat icon={UsersRound} label="волонтёры" value={`${volunteers}+`} caption="участвовали или нужны сейчас" tone="green" />
        <FoundationStat icon={Trophy} label="часы" value={`${totalHours}+`} caption="помощи в активностях фонда" />
        <FoundationStat icon={Sparkles} label="отклик" value={`${foundation.responseRate}%`} caption="заявок получают ответ фонда" tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <DetailCard>
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Чем занимается фонд</p>
                <h2 className="mt-3 text-3xl font-black leading-tight">Помощь, которую легко понять и к которой легко присоединиться</h2>
                <p className="mt-4 text-base font-medium leading-8 text-black/60">{details.mission}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {details.activityTypes.map((item) => (
                    <p key={item} className="flex items-center gap-3 rounded-[1.1rem] bg-[#fffdf7] p-3 text-sm font-black text-black/64">
                      <CheckCircle2 className="size-4 shrink-0 text-brand" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.35rem] bg-brand/12 p-5">
                <IconBubble icon={Sparkles} />
                <p className="mt-5 text-xl font-black leading-tight">Фокус фонда</p>
                <p className="mt-3 text-sm font-bold leading-6 text-black/58">{foundation.focus}</p>
              </div>
            </div>
          </DetailCard>

          <DetailCard>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Категории помощи</p>
                <h2 className="mt-2 text-3xl font-black">Кому и чем помогает организация</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {details.categories.map((category) => (
                <span key={category} className="rounded-full bg-brand/12 px-4 py-2 text-sm font-black text-black/66">
                  {category}
                </span>
              ))}
            </div>
          </DetailCard>

          <section id="active-tasks" className="scroll-mt-28">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Активности фонда</p>
                <h2 className="mt-2 text-3xl font-black">Активные задания</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {activeTasks.map((task) => <FoundationActivityCard key={task.id} task={task} />)}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">История помощи</p>
                <h2 className="mt-2 text-3xl font-black">Завершённые активности</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {completedTasks.map((task) => <FoundationActivityCard key={`${task.id}-completed`} compact task={task} />)}
            </div>
          </section>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
          <DetailCard>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Контакты</p>
            <div className="mt-5 space-y-3">
              <ContactRow icon={Mail} label="Email" value={details.email} />
              <ContactRow icon={Phone} label="Телефон" value={details.phone} />
              <ContactRow icon={Globe2} label="Сайт" value={details.site} />
              <ContactRow icon={UsersRound} label="Контактное лицо" value={foundation.curator} />
              <ContactRow icon={ShieldCheck} label="ИНН/ОГРН" value={details.inn} />
            </div>
          </DetailCard>

          <DetailCard className="bg-brand/12">
            <IconBubble icon={ArrowRight} className="bg-brand text-black shadow-[0_12px_26px_rgba(255,227,0,0.24)]" />
            <h3 className="mt-5 text-2xl font-black leading-tight">Хотите помочь этому фонду?</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-black/58">Выберите активность, откликнитесь, дождитесь решения координатора и получите часы после подтверждения участия.</p>
            <Link href="#active-tasks" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-black text-black shadow-[0_12px_26px_rgba(255,227,0,0.22)] transition hover:-translate-y-0.5">
              Перейти к заданиям
            </Link>
          </DetailCard>
        </aside>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.1rem] bg-[#fffdf7] p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-black">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
        <p className="truncate text-sm font-black text-black/68">{value}</p>
      </div>
    </div>
  );
}

function buildFoundationDetails(foundation: Foundation, tasks: VolunteerTask[]): FoundationPublicDetails {
  const categories = Array.from(new Set(tasks.map((task) => task.category))).slice(0, 6);

  return {
    verified: foundation.moderationStatus === "approved",
    logo: foundation.name.slice(0, 2).toUpperCase(),
    description: foundation.focus,
    site: "example.org",
    icons: [ShieldCheck, BadgeCheck, UsersRound],
    mission: foundation.focus,
    activityTypes: tasks.length ? tasks.slice(0, 4).map((task) => task.title) : [foundation.focus],
    categories: categories.length ? categories : [foundation.focus],
    email: "contacts@example.org",
    phone: "Контакты уточняются",
    inn: "Не указан"
  };
}
