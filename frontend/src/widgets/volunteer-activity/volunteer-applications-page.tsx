"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { applicationApi } from "@/shared/api/services";
import { formatDateTime, mapApiTaskToVolunteerTask, mapApplicationStatus } from "@/shared/api/mappers";
import { statusFilters, type VolunteerApplicationItem, type VolunteerApplicationStage } from "@/widgets/volunteer-activity/activity-data";
import { ApplicationCard } from "@/widgets/volunteer-activity/ui/application-card";
import { ApplicationStatusFlow } from "@/widgets/volunteer-activity/ui/application-status-flow";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";

type FilterValue = (typeof statusFilters)[number]["value"];

export function VolunteerApplicationsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VolunteerApplicationItem | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const applicationsQuery = useQuery({
    queryKey: ["applications", "my"],
    queryFn: () => applicationApi.listMine()
  });

  const applicationItems = useMemo(
    () => (applicationsQuery.data ?? []).filter((item) => item.task).map((item) => mapApplicationItem(item)),
    [applicationsQuery.data]
  );

  const cancelMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.cancel(applicationId),
    onSuccess: async () => {
      setApplicationError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error) => setApplicationError(error instanceof Error ? error.message : "Не удалось отменить отклик")
  });

  const filteredApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applicationItems.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.stage === activeFilter || (activeFilter === "completed" && (item.stage === "completed" || item.stage === "hours"));
      const haystack = [item.task.title, item.task.foundation, item.task.city, item.statusLabel, item.stageLabel, item.message, item.nextAction].join(" ").toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [activeFilter, applicationItems, query]);

  const counts = useMemo(() => {
    const byStage = applicationItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      if (item.stage === "hours") acc.completed = (acc.completed ?? 0) + 1;
      return acc;
    }, { all: applicationItems.length });
    return byStage;
  }, [applicationItems]);

  return (
    <section className="rounded-[1.55rem] bg-white p-4 shadow-[0_20px_70px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-black leading-none md:text-3xl">Мои отклики</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/54">
            Здесь видно, где заявка на рассмотрении, где доступны контакты фонда и какие действия нужны дальше.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 min-w-[280px] items-center gap-3 rounded-full bg-[#f8f7f2] px-4">
            <Search className="size-4 text-black/46" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по откликам" className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-black/38" />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12">
            <ArrowDownUp className="size-4" />
            Сначала новые
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition",
              activeFilter === filter.value ? "bg-black text-white shadow-[0_14px_28px_rgba(24,20,7,0.14)]" : "bg-white text-black/58 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] hover:bg-brand/12 hover:text-black"
            )}
          >
            {filter.label}
            <span className={cn("rounded-full px-2 py-0.5 text-xs", activeFilter === filter.value ? "bg-white/16 text-white" : "bg-[#f4f3ee] text-black/52")}>{counts[filter.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <ApplicationStatusFlow stage="accepted" />
      </div>

      <div className="mt-4 space-y-3">
        {applicationsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-[1.35rem] bg-[#fffdf7]" />)
        ) : (
          filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} onOpen={setSelected} />
          ))
        )}
      </div>

      {!applicationsQuery.isLoading && filteredApplications.length === 0 ? (
        <section className="mt-4 rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
          <p className="text-2xl font-black">Откликов с такими параметрами нет</p>
          <p className="mt-3 text-sm font-medium text-black/54">Попробуйте изменить фильтр или поисковый запрос.</p>
        </section>
      ) : null}

      <TaskDetailDrawer
        applicationError={applicationError}
        isApplicationMutating={cancelMutation.isPending}
        onCancel={async (task) => {
          const item = applicationItems.find((application) => application.task.id === task.id);
          if (item) {
            await cancelMutation.mutateAsync(item.id);
          }
        }}
        onClose={() => setSelected(null)}
        onStatusChange={() => undefined}
        onTaskOpen={(task) => {
          const next = applicationItems.find((item) => item.task.id === task.id);
          if (next) setSelected(next);
        }}
        status={selected?.detailStatus ?? "idle"}
        task={selected?.task ?? null}
        tasks={applicationItems.map((item) => item.task)}
      />
    </section>
  );
}

function mapApplicationItem(application: NonNullable<Awaited<ReturnType<typeof applicationApi.listMine>>[number]>): VolunteerApplicationItem {
  const task = mapApiTaskToVolunteerTask(application.task!, [application]);
  const stage = mapStage(application.status);
  const detailStatus = mapApplicationStatus(application.status);

  return {
    id: application.id,
    task,
    stage,
    detailStatus,
    title: statusTitle(application.status),
    statusLabel: statusTitle(application.status),
    stageLabel: application.fund_comment ?? "Статус обновляется фондом",
    eventDate: task.date,
    appliedAt: formatDateTime(application.created_at),
    deadline: task.deadline,
    progress: progressByStage(stage),
    nextAction: nextAction(application.status),
    message: application.fund_comment ?? application.volunteer_comment ?? "Заявка отправлена в фонд.",
    foundationComment: application.fund_comment ?? undefined,
    contactUnlocked: application.status === "accepted" || application.status === "completion_confirmed" || application.status === "hours_awarded",
    contact: {
      name: task.contact.name,
      role: task.contact.role,
      email: "Контакты доступны у фонда",
      phone: task.contact.phone,
      telegram: "-",
      whatsapp: "-",
      chat: task.title,
      instruction: application.completion_comment ?? "Свяжитесь с координатором после принятия заявки."
    }
  };
}

function mapStage(status: string): VolunteerApplicationStage {
  if (status === "applied") return "pending";
  if (status === "accepted") return "accepted";
  if (status === "completion_confirmed") return "completed";
  if (status === "hours_awarded") return "hours";
  if (status === "rejected") return "rejected";
  return "pending";
}

function progressByStage(stage: VolunteerApplicationStage) {
  const values: Record<VolunteerApplicationStage, number> = {
    pending: 30,
    accepted: 58,
    "in-progress": 72,
    completed: 88,
    hours: 100,
    rejected: 100
  };
  return values[stage];
}

function statusTitle(status: string) {
  const titles: Record<string, string> = {
    applied: "Ожидается решение фонда",
    accepted: "Вы приняты к участию",
    rejected: "Отклик не принят",
    canceled: "Отклик отменен",
    completion_confirmed: "Участие подтверждено",
    hours_awarded: "Часы начислены"
  };
  return titles[status] ?? status;
}

function nextAction(status: string) {
  const actions: Record<string, string> = {
    applied: "Пока ничего делать не нужно",
    accepted: "Свяжитесь с координатором и подготовьтесь к участию",
    rejected: "Можно откликнуться на другие задания",
    canceled: "Отклик отменен",
    completion_confirmed: "Ожидается начисление часов",
    hours_awarded: "Часы уже добавлены в профиль"
  };
  return actions[status] ?? "Следите за обновлениями";
}
