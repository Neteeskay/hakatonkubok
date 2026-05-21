import { BarChart3, Building2, CheckCircle2, Clock, Download, FileBarChart, ListChecks, ShieldCheck, UsersRound } from "lucide-react";
import { applications, foundations, impactSeries, moderationQueue, tasks } from "@/shared/config/mock-data";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

export function AdminFoundationsPage() {
  return <AdminShell title="Фонды" description="Единый реестр фондов с модерационным статусом, куратором и показателями доверия."><FoundationList /></AdminShell>;
}

export function AdminFoundationModerationPage() {
  return (
    <AdminShell title="Модерация фондов" description="Approve, reject или revision с обязательным комментарием для фонда.">
      <EditorialList items={foundations.map((item) => ({ title: item.name, meta: item.city, text: `${item.focus}. Куратор: ${item.curator}.`, status: item.moderationStatus }))} />
    </AdminShell>
  );
}

export function AdminTasksPage() {
  return (
    <AdminShell title="Задания" description="Все активности программы: опубликованные, закрытые и ожидающие проверки.">
      <EditorialList items={tasks.map((task) => ({ title: task.title, meta: `${task.foundation} / ${task.city}`, text: `${task.hours} часов, ${task.filled}/${task.spots} участников. ${task.impact}`, status: task.status }))} />
    </AdminShell>
  );
}

export function AdminTaskModerationPage() {
  return (
    <AdminShell title="Модерация заданий" description="Проверка корректности описания, формата участия, материалов и отсутствия fundraising.">
      <EditorialList items={moderationQueue.map((item) => ({ title: item.title, meta: item.type, text: `Ответственный: ${item.owner}. Решение фиксируется в истории модерации.`, status: item.status }))} />
    </AdminShell>
  );
}

export function AdminVolunteersPage() {
  return (
    <AdminShell title="Волонтёры" description="Участники программы, их часы, активность и участие в категориях помощи.">
      <EditorialList items={applications.map((item) => ({ title: item.volunteer, meta: item.task, text: `Статус участия: ${item.status}. Потенциально к начислению: ${item.hours} часов.`, status: "профиль" }))} />
    </AdminShell>
  );
}

export function AdminHoursPage() {
  return (
    <AdminShell title="Начисление часов" description="Финальная стадия цепочки: фонд подтвердил факт участия, администратор проверяет и начисляет часы.">
      <EditorialList
        items={[
          { title: "Анна Соколова", meta: "Семейный спортивный день", text: "Фонд подтвердил участие. Нужно проверить 5 часов и дату события.", status: "confirm" },
          { title: "Павел Ильин", meta: "Медиакит для забега", text: "Материалы переданы фонду. Ожидается финальное подтверждение координатора.", status: "waiting foundation" },
          { title: "Дарья Никифорова", meta: "Наставничество", text: "Две встречи завершены, есть комментарий фонда.", status: "ready" }
        ]}
      />
    </AdminShell>
  );
}

export function AdminAnalyticsPage() {
  return (
    <AdminShell title="Аналитика" description="Сводка по волонтёрам, часам, категориям, фондам и завершённым активностям.">
      <div className="grid gap-4 md:grid-cols-5">
        {impactSeries.map((item) => (
          <div key={item.month} className="rounded-[1.35rem] bg-white/70 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{item.month}</p>
            <p className="mt-3 text-3xl font-black">{item.hours}</p>
            <p className="mt-1 text-sm text-black/54">часов / {item.tasks} задач</p>
            <div className="mt-4 h-2 rounded-full bg-black/8">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, item.hours / 8)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminReportsPage() {
  return (
    <AdminShell title="Отчёты" description="Экспорт управленческой отчётности по программе корпоративного волонтёрства.">
      <div className="grid gap-4 md:grid-cols-2">
        {["Сводка по фондам", "Часы по волонтёрам", "Активности по категориям", "Модерационные решения"].map((title) => (
          <div key={title} className="flex items-center justify-between rounded-[1.35rem] bg-white/70 p-5">
            <div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-1 text-sm text-black/52">CSV / Excel</p>
            </div>
            <Download className="size-6" />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function FoundationList() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {foundations.map((foundation) => (
        <div key={foundation.id} className="rounded-[1.35rem] bg-white/70 p-5">
          <StatusPill tone={foundation.moderationStatus === "approved" ? "green" : "gold"}>{foundation.moderationStatus}</StatusPill>
          <h3 className="mt-4 text-xl font-black">{foundation.name}</h3>
          <p className="mt-2 text-sm leading-6 text-black/58">{foundation.focus}</p>
        </div>
      ))}
    </div>
  );
}

function AdminShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Администрирование" title={title} description={description} tone="dark" />
      <MetricStrip
        items={[
          { icon: UsersRound, value: "10 000+", label: "волонтёров" },
          { icon: Clock, value: "1 000 000+", label: "часов помощи" },
          { icon: Building2, value: "200+", label: "фондов и НКО" },
          { icon: ShieldCheck, value: "18", label: "на модерации" }
        ]}
      />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}
