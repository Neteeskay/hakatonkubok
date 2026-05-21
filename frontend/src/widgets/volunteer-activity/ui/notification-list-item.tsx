"use client";

import type { VolunteerTask } from "@/entities/task/model";
import { cn } from "@/shared/lib/utils";
import { notificationToneStyles, type VolunteerNotification } from "@/widgets/volunteer-activity/notification-data";

export function NotificationListItem({ item, onOpenTask, onOpenRoute }: { item: VolunteerNotification; onOpenTask: (task: VolunteerTask) => void; onOpenRoute: (href: string) => void }) {
  const tone = notificationToneStyles[item.tone];
  const Icon = item.icon;

  const open = () => {
    if (item.task && (item.target === "task" || item.target === "application")) {
      onOpenTask(item.task);
      return;
    }
    if (item.target === "profile") onOpenRoute("/volunteer/profile");
    if (item.target === "hours") onOpenRoute("/volunteer/hours");
  };

  return (
    <button
      onClick={open}
      className={cn(
        "group relative grid w-full gap-4 rounded-[1.1rem] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(34,28,8,0.06)] md:grid-cols-[64px_1fr_auto]",
        tone.surface
      )}
    >
      <span className={cn("grid size-14 place-items-center rounded-full", tone.icon)}>
        <Icon className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black leading-5">{item.title}</span>
        <span className="mt-2 block max-w-3xl text-sm font-bold leading-6 text-black/58">{item.text}</span>
        <span className={cn("mt-3 inline-flex text-xs font-black transition group-hover:translate-x-1", tone.text)}>{item.actionLabel}</span>
      </span>
      <span className="flex items-start gap-3 text-xs font-bold text-black/48">
        {item.time}
        <span className={cn("mt-1.5 size-2.5 rounded-full", item.unread ? tone.dot : "bg-black/12")} />
      </span>
    </button>
  );
}
