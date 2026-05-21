"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { VolunteerTask } from "@/entities/task/model";
import { getApiErrorMessage, volunteersService } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import {
  notificationSettings,
  notificationStatusCards,
  notificationTabs,
  type VolunteerNotification
} from "@/widgets/volunteer-activity/notification-data";
import { mapNotificationResponseToItem } from "@/widgets/volunteer-activity/activity-api-mappers";
import { NotificationFeaturedCard } from "@/widgets/volunteer-activity/ui/notification-featured-card";
import { NotificationListItem } from "@/widgets/volunteer-activity/ui/notification-list-item";
import { NotificationStatusCard } from "@/widgets/volunteer-activity/ui/notification-status-card";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

type TabValue = (typeof notificationTabs)[number]["value"];

export function VolunteerNotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [notifications, setNotifications] = useState<VolunteerNotification[]>([]);
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setLoading(true);
      setError(null);

      try {
        const response = await volunteersService.getMyVolunteerNotifications({ limit: 100 });
        if (!mounted) return;
        setNotifications(response.map(mapNotificationResponseToItem));
      } catch (loadError) {
        if (!mounted) return;
        setError(getApiErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;
  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((item) => item.unread);
    if (activeTab === "archive") return notifications.filter((item) => !item.unread);
    return notifications;
  }, [activeTab, notifications]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce<Record<VolunteerNotification["dateLabel"], VolunteerNotification[]>>(
      (acc, item) => {
        acc[item.dateLabel].push(item);
        return acc;
      },
      { Сегодня: [], Вчера: [], Ранее: [] }
    );
  }, [filteredNotifications]);
  const featuredNotification = filteredNotifications.find((item) => item.unread) ?? filteredNotifications[0];

  async function markRead(item: VolunteerNotification) {
    if (!item.unread) return;

    try {
      const response = await volunteersService.markMyNotificationRead(item.id);
      const next = mapNotificationResponseToItem(response);
      setNotifications((items) => items.map((notification) => notification.id === item.id ? next : notification));
    } catch (readError) {
      setError(getApiErrorMessage(readError));
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((item) => item.unread);
    if (!unread.length || markingAll) return;

    setMarkingAll(true);
    setError(null);

    try {
      const responses = await Promise.all(unread.map((item) => volunteersService.markMyNotificationRead(item.id)));
      const nextById = new Map(responses.map((item) => [item.id, mapNotificationResponseToItem(item)]));
      setNotifications((items) => items.map((item) => nextById.get(item.id) ?? item));
    } catch (readError) {
      setError(getApiErrorMessage(readError));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <section className="rounded-[1.55rem] bg-white p-4 shadow-[0_20px_70px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-none md:text-4xl">Уведомления</h1>
          <div className="mt-4 h-1 w-10 rounded-full bg-brand" />
        </div>
        <button onClick={markAllRead} disabled={!unreadCount || markingAll} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12 disabled:opacity-60 md:self-auto">
          <RefreshCw className="size-4" />
          {markingAll ? "Отмечаем..." : "Отметить все как прочитанные"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-8">
        {notificationTabs.map((tab) => {
          const count = tab.value === "all" ? notifications.length : tab.value === "unread" ? unreadCount : notifications.length - unreadCount;
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

      {featuredNotification ? (
        <div className="mt-6">
          <NotificationFeaturedCard notification={featuredNotification} onOpenTask={setSelectedTask} onOpenRoute={router.push} onRead={(item) => { void markRead(item); }} />
        </div>
      ) : null}

      <div className="mt-9">
        <h2 className="text-xl font-black">Недавние уведомления</h2>
        <div className="mt-5 space-y-5">
          {loading ? (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">Загружаем уведомления...</p>
            </section>
          ) : error ? (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">Не удалось загрузить уведомления</p>
              <p className="mt-3 text-sm font-medium text-black/54">{error}</p>
            </section>
          ) : filteredNotifications.length ? (["Сегодня", "Вчера", "Ранее"] as const).map((group) =>
            groupedNotifications[group].length ? (
              <div key={group} className="space-y-3">
                {group !== "Сегодня" ? <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-black/34">{group}</p> : null}
                {groupedNotifications[group].map((item) => (
                  <NotificationListItem key={item.id} item={item} onOpenTask={setSelectedTask} onOpenRoute={router.push} onRead={(notification) => { void markRead(notification); }} />
                ))}
              </div>
            ) : null
          ) : (
            <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
              <p className="text-2xl font-black">Уведомлений пока нет</p>
              <p className="mt-3 text-sm font-medium text-black/54">Новые события по откликам и часам появятся здесь.</p>
            </section>
          )}
        </div>
        {!loading && !error && filteredNotifications.length ? <button className="mt-5 h-11 w-full rounded-full bg-[#fbfaf4] text-sm font-black text-black/58 transition hover:bg-brand/12">
          Показать все уведомления
        </button> : null}
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
