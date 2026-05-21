import type { ComponentType } from "react";
import { cn } from "@/shared/lib/utils";
import { notificationToneStyles, type NotificationTone } from "@/widgets/volunteer-activity/notification-data";

export function NotificationStatusCard({ title, text, tone, icon: Icon }: { title: string; text: string; tone: NotificationTone; icon: ComponentType<{ className?: string }> }) {
  const styles = notificationToneStyles[tone];

  return (
    <article className={cn("min-h-[190px] rounded-[1.15rem] p-5", styles.surface)}>
      <span className={cn("grid size-12 place-items-center rounded-full", styles.icon)}>
        <Icon className="size-6" />
      </span>
      <h3 className="mt-7 text-sm font-black">{title}</h3>
      <p className="mt-4 text-xs font-bold leading-6 text-black/58">{text}</p>
    </article>
  );
}
