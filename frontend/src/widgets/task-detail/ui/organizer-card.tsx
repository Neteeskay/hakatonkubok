import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, MapPin, ShieldCheck } from "lucide-react";
import type { Foundation } from "@/entities/foundation/model";
import { getFoundationDetails } from "@/widgets/foundation-public/model/foundation-public-data";
import { Pill } from "@/widgets/task-detail/ui/detail-card";

export function OrganizerCard({ foundation }: { foundation: Foundation }) {
  const details = getFoundationDetails(foundation.id);

  return (
    <Link
      href={`/foundations/${foundation.id}`}
      className="group block rounded-[1.45rem] bg-white p-5 shadow-[0_18px_60px_rgba(34,28,8,0.07),inset_0_0_0_1px_rgba(24,20,7,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(34,28,8,0.11),inset_0_0_0_1px_rgba(255,227,0,0.46)] md:p-6"
      aria-label={`Открыть страницу фонда ${foundation.name}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Организатор задания</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/14 text-black transition group-hover:bg-brand">
          <ArrowRight className="size-4" />
        </span>
      </div>

      <div className="mt-5 flex gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-[1.2rem] bg-brand text-xl font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.24)]">{details.logo}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black leading-tight transition group-hover:text-black/72">{foundation.name}</h3>
            {details.verified ? <Pill tone="green"><BadgeCheck className="mr-1 size-3.5" />проверен</Pill> : <Pill tone="gold">на проверке</Pill>}
          </div>
          <p className="mt-2 text-sm leading-6 text-black/58">{details.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-black/56"><MapPin className="size-4" />{foundation.city}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {details.categories.slice(0, 4).map((category) => (
          <span key={category} className="rounded-full bg-brand/12 px-3 py-1.5 text-xs font-black text-black/62">
            {category}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.1rem] bg-[#fffdf7] p-3">
          <BriefcaseBusiness className="size-4 text-black/45" />
          <p className="mt-2 text-lg font-black">{foundation.activeTasks}</p>
          <p className="text-xs font-bold text-black/44">активных заданий</p>
        </div>
        <div className="rounded-[1.1rem] bg-[#fffdf7] p-3">
          <ShieldCheck className="size-4 text-black/45" />
          <p className="mt-2 text-lg font-black">{foundation.responseRate}%</p>
          <p className="text-xs font-bold text-black/44">ответов на заявки</p>
        </div>
      </div>
    </Link>
  );
}
