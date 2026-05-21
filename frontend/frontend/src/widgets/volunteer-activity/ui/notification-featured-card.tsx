"use client";

import { CalendarDays, Clock3, MapPin, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { VolunteerTask } from "@/entities/task/model";
import { featuredNotification } from "@/widgets/volunteer-activity/notification-data";

export function NotificationFeaturedCard({ onOpenTask }: { onOpenTask: (task: VolunteerTask) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[1.45rem] bg-[#f1fbf1] p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.04)] md:p-8">
      <span className="absolute right-5 top-5 size-2.5 rounded-full bg-[#43bf5b]" />
      <p className="absolute right-9 top-5 text-xs font-bold text-black/38">{featuredNotification.timeAgo}</p>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr_220px] lg:items-center">
        <div className="relative flex h-48 items-center justify-center">
          <Image src="/success.png" alt="Отклик принят" width={150} height={150} className="h-[300px] w-[300px] object-contain" priority />
        </div>

        <div className="min-w-0">
          <span className="inline-flex rounded-lg bg-[#dff7e3] px-4 py-2 text-xs font-black text-[#247a31]">{featuredNotification.label}</span>
          <h1 className="mt-5 text-3xl font-black leading-tight md:text-4xl">{featuredNotification.title}</h1>
          <p className="mt-5 max-w-xl text-base font-bold leading-7 text-black/66">{featuredNotification.text}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onOpenTask(featuredNotification.task)} className="h-12 rounded-xl bg-brand px-6 text-sm font-black text-black shadow-[0_16px_30px_rgba(255,227,0,0.24)] transition hover:-translate-y-0.5">
              Смотреть задание
            </button>
            <button className="h-12 rounded-xl bg-white px-6 text-sm font-black text-black/68 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:bg-brand/12">
              Написать организатору
            </button>
          </div>
        </div>

        <div className="space-y-5 border-black/8 lg:border-l lg:pl-8">
          <FeatureMeta icon={CalendarDays} label="Дата начала" value={featuredNotification.date} />
          <FeatureMeta icon={Clock3} label="Время" value={featuredNotification.time} />
          <FeatureMeta icon={MapPin} label="Формат" value={featuredNotification.format} />
        </div>
      </div>
    </section>
  );
}

function FeatureMeta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="mt-0.5 size-6 text-black/58" />
      <div>
        <p className="text-xs font-bold text-black/38">{label}</p>
        <p className="mt-1 text-sm font-black leading-5">{value}</p>
      </div>
    </div>
  );
}
