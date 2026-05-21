"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { VolunteerTask } from "@/entities/task/model";
import { cn } from "@/shared/lib/utils";
import {
  notificationSettings,
  notificationStatusCards,
  notificationTabs,
  volunteerNotifications,
  type VolunteerNotification
} from "@/widgets/volunteer-activity/notification-data";
import { NotificationFeaturedCard } from "@/widgets/volunteer-activity/ui/notification-featured-card";
import { NotificationListItem } from "@/widgets/volunteer-activity/ui/notification-list-item";
import { NotificationStatusCard } from "@/widgets/volunteer-activity/ui/notification-status-card";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

type TabValue = (typeof notificationTabs)[number]["value"];

export function VolunteerNotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, ApplicationStatus>>({});

  const unreadCount = volunteerNotifications.filter((item) => item.unread).length;
  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") return volunteerNotifications.filter((item) => item.unread);
    if (activeTab === "archive") return volunteerNotifications.filter((item) => !item.unread);
    return volunteerNotifications;
  }, [activeTab]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce<Record<VolunteerNotification["dateLabel"], VolunteerNotification[]>>(
      (acc, item) => {
        acc[item.dateLabel].push(item);
        return acc;
      },
      { Сегодня: [], Вчера: [], Ранее: [] }
    );
  }, [filteredNotifications]);

  return (
    <section className="rounded-[1.55rem] bg-white p-4 shadow-[0_20px_70px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-none md:text-4xl">Уведомления</h1>
          <div className="mt-4 h-1 w-10 rounded-full bg-brand" />
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12 md:self-auto">
          <RefreshCw className="size-4" />
          Отметить все как прочитанные
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-8">
        {notificationTabs.map((tab) => {
          const count = tab.value === "all" ? volunteerNotifications.length : tab.value === "unread" ? unreadCount : volunteerNotifications.length - unreadCount;
          const active = activeTab === tab.value;
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={cn("relative pb-3 text-sm font-black text-black/58 transition hover:text-black", active && "text-black")}>
              {tab.label}
              <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", active ? "bg-brand text-black" : "bg-[#f4f3ee] text-black/52")}>{count}</span>
              {active ? <span className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-brand" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <NotificationFeaturedCard onOpenTask={setSelectedTask} />
      </div>

      <div className="mt-9">
        <h2 className="text-xl font-black">Недавние уведомления</h2>
        <div className="mt-5 space-y-5">
          {(["Сегодня", "Вчера", "Ранее"] as const).map((group) =>
            groupedNotifications[group].length ? (
              <div key={group} className="space-y-3">
                {group !== "Сегодня" ? <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-black/34">{group}</p> : null}
                {groupedNotifications[group].map((item) => (
                  <NotificationListItem key={item.id} item={item} onOpenTask={setSelectedTask} onOpenRoute={router.push} />
                ))}
              </div>
            ) : null
          )}
        </div>
        <button className="mt-5 h-11 w-full rounded-full bg-[#fbfaf4] text-sm font-black text-black/58 transition hover:bg-brand/12">
          Показать все уведомления
        </button>
      </div>

      <div className="mt-9">
        <h2 className="text-xl font-black">Что означают статусы?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {notificationStatusCards.map((card) => (
            <NotificationStatusCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      <div className="mt-9 grid gap-3 rounded-[1.25rem] bg-[#fffdf7] p-4 md:grid-cols-5">
        {notificationSettings.map((setting) => (
          <label key={setting.title} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-xs font-black text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.045)]">
            {setting.title}
            <span className={cn("h-6 w-11 rounded-full p-1 transition", setting.enabled ? "bg-brand" : "bg-[#e8e5dc]")}>
              <span className={cn("block size-4 rounded-full bg-white shadow transition", setting.enabled && "translate-x-5")} />
            </span>
          </label>
        ))}
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        status={selectedTask ? taskStatuses[selectedTask.id] ?? "accepted" : "idle"}
        onStatusChange={(status) => {
          if (!selectedTask) return;
          setTaskStatuses((current) => ({ ...current, [selectedTask.id]: status }));
        }}
        onClose={() => setSelectedTask(null)}
        onTaskOpen={setSelectedTask}
      />
    </section>
  );
}
