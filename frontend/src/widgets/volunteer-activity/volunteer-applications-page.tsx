"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { applicationsService, getApiErrorMessage } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import { statusFilters, type VolunteerApplicationItem } from "@/widgets/volunteer-activity/activity-data";
import { apiStatusToDetailStatus, mapApplicationResponseToItem } from "@/widgets/volunteer-activity/activity-api-mappers";
import { ApplicationCard } from "@/widgets/volunteer-activity/ui/application-card";
import { ApplicationStatusFlow } from "@/widgets/volunteer-activity/ui/application-status-flow";
import { TaskDetailDrawer } from "@/widgets/volunteer-feed/task-detail-drawer";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

type FilterValue = (typeof statusFilters)[number]["value"];

export function VolunteerApplicationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState<VolunteerApplicationItem[]>([]);
  const [selected, setSelected] = useState<VolunteerApplicationItem | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadApplications() {
      setLoading(true);
      setError(null);

      try {
        const response = await applicationsService.getMyApplications();
        if (!mounted) return;

        const items = response.map(mapApplicationResponseToItem);
        setApplications(items);
        setStatuses(Object.fromEntries(items.map((item) => [item.task.id, item.detailStatus])));
      } catch (loadError) {
        if (!mounted) return;
        setError(getApiErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadApplications();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.stage === activeFilter || (activeFilter === "completed" && (item.stage === "completed" || item.stage === "hours"));
      const haystack = [item.task.title, item.task.foundation, item.task.city, item.statusLabel, item.stageLabel, item.message, item.nextAction].join(" ").toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [activeFilter, applications, query]);

  const counts = useMemo(() => {
    const byStage = applications.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      if (item.stage === "hours") acc.completed = (acc.completed ?? 0) + 1;
      return acc;
    }, { all: applications.length });
    return byStage;
  }, [applications]);

  const allTasks = useMemo(() => applications.map((item) => item.task), [applications]);
  const selectedSubmitting = Boolean(selected && submittingTaskId === selected.task.id);

  async function cancelApplication(task: VolunteerTask) {
    const application = applications.find((item) => item.task.id === task.id);

    if (!application) {
      setApplicationError("Не удалось найти отклик для отмены. Обновите страницу и попробуйте ещё раз.");
      return;
    }

    setSubmittingTaskId(task.id);
    setApplicationError(null);

    try {
      const response = await applicationsService.cancelMyApplication(application.id);
      const next = mapApplicationResponseToItem(response);
      setApplications((items) => items.map((item) => item.id === next.id ? next : item));
      setSelected(next);
      setStatuses((current) => ({ ...current, [task.id]: apiStatusToDetailStatus(response.status) }));
    } catch (cancelError) {
      setApplicationError(getApiErrorMessage(cancelError));
    } finally {
      setSubmittingTaskId(null);
    }
  }

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
        {loading ? (
          <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
            <p className="text-2xl font-black">Загружаем отклики...</p>
          </section>
        ) : error ? (
          <section className="rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
            <p className="text-2xl font-black">Не удалось загрузить отклики</p>
            <p className="mt-3 text-sm font-medium text-black/54">{error}</p>
          </section>
        ) : filteredApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} onOpen={setSelected} />
        ))}
      </div>

      {!loading && !error && filteredApplications.length === 0 ? (
        <section className="mt-4 rounded-[1.35rem] bg-[#fffdf7] p-8 text-center">
          <p className="text-2xl font-black">Откликов с такими параметрами нет</p>
          <p className="mt-3 text-sm font-medium text-black/54">Попробуйте изменить фильтр или поисковый запрос.</p>
        </section>
      ) : null}

      <TaskDetailDrawer
        task={selected?.task ?? null}
        allTasks={allTasks}
        status={selected ? statuses[selected.task.id] ?? selected.detailStatus : "idle"}
        applicationError={applicationError}
        applicationSubmitting={selectedSubmitting}
        onCancelApplication={cancelApplication}
        onStatusChange={(status) => {
          if (!selected) return;
          setStatuses((current) => ({ ...current, [selected.task.id]: status }));
        }}
        onClose={() => setSelected(null)}
        onTaskOpen={(task) => {
          const next = applications.find((item) => item.task.id === task.id);
          if (next) setSelected(next);
        }}
      />
    </section>
  );
}
