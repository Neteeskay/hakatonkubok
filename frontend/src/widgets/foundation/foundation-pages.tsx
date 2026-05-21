"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Download, Plus, ShieldCheck } from "lucide-react";
import { applicationsService, fundsService, getApiErrorMessage, notificationsService, tasksService } from "@/shared/api";
import type { HelpCategoryResponse, NotificationResponse, SkillOptionResponse, TaskFilterOptionsResponse } from "@/shared/api";
import {
  currentFoundation,
  foundationMetrics,
  reportMetrics,
  type FoundationApplicationItem,
  type FoundationApplicationStatus,
  type FoundationTaskItem,
  type FoundationTaskStatus
} from "@/widgets/foundation/foundation-data";
import {
  buildFundUpdateRequest,
  buildTaskCreateRequest,
  buildTaskUpdateRequest,
  mapApplicationResponseToFoundationApplication,
  mapDashboardToMetrics,
  mapDashboardToReportMetrics,
  mapFundDocuments,
  mapFundProfileToCurrentFoundation,
  mapFundProfileToProfileForm,
  mapTaskResponseToFoundationTask
} from "@/widgets/foundation/foundation-api-mappers";
import { CreateTaskForm, type FoundationTaskFormValues } from "@/widgets/foundation/ui/create-task-form";
import { FoundationApplicationCard } from "@/widgets/foundation/ui/foundation-application-card";
import { FoundationMetricCard } from "@/widgets/foundation/ui/foundation-metric-card";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";
import { FoundationTaskCard } from "@/widgets/foundation/ui/foundation-task-card";
import { FoundationTaskEditor } from "@/widgets/foundation/ui/foundation-task-editor";
import { FoundationProfileWorkspace } from "@/widgets/foundation/ui/foundation-profile-workspace";

function useFoundationWorkspaceData() {
  const [foundation, setFoundation] = useState<ReturnType<typeof mapFundProfileToCurrentFoundation>>(currentFoundation);
  const [tasks, setTasks] = useState<FoundationTaskItem[]>([]);
  const [applications, setApplications] = useState<FoundationApplicationItem[]>([]);
  const [metrics, setMetrics] = useState<typeof foundationMetrics>([]);
  const [reports, setReports] = useState<typeof reportMetrics>([]);
  const [profileForm, setProfileForm] = useState<ReturnType<typeof mapFundProfileToProfileForm> | null>(null);
  const [documents, setDocuments] = useState<ReturnType<typeof mapFundDocuments>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [profileResponse, dashboardResponse, taskResponses, applicationResponses] = await Promise.all([
        fundsService.getMyFundProfile(),
        fundsService.getMyFundDashboard(),
        tasksService.getMyTasks(),
        applicationsService.getFundApplications()
      ]);

      setFoundation(mapFundProfileToCurrentFoundation(profileResponse, dashboardResponse));
      setTasks(taskResponses.map((task) => mapTaskResponseToFoundationTask(task, applicationResponses)));
      setApplications(applicationResponses.map(mapApplicationResponseToFoundationApplication));
      setMetrics(mapDashboardToMetrics(dashboardResponse));
      setReports(mapDashboardToReportMetrics(dashboardResponse));
      setProfileForm(mapFundProfileToProfileForm(profileResponse));
      setDocuments(mapFundDocuments(profileResponse));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return { applications, documents, error, foundation, loading, metrics, profileForm, reload: load, reports, setApplications, setDocuments, setTasks, tasks };
}

const fallbackParticipantsTask: FoundationTaskItem = {
  id: "applications-without-task",
  taskId: "applications-without-task",
  title: "Отклики без данных задания",
  description: "",
  category: "Помощь",
  city: "Город не указан",
  format: "Офлайн",
  deadline: "без дедлайна",
  period: "период не указан",
  participants: 0,
  capacity: 0,
  responses: 0,
  hours: 0,
  instructions: "",
  location: "",
  requirements: [],
  skills: [],
  status: "published",
  taskType: "regular",
  contactVisibility: "after_acceptance",
  contacts: {
    telegram: "",
    whatsapp: "",
    email: "",
    phone: "",
    chatLink: "",
    instruction: ""
  }
};

async function uploadTaskImageIfNeeded(taskId: string, values: FoundationTaskFormValues) {
  if (values.imageFile) {
    await tasksService.uploadMyTaskImage(taskId, values.imageFile);
  }
}

export function FoundationDashboardPage() {
  const { applications, error, foundation, loading, metrics, setTasks, tasks } = useFoundationWorkspaceData();
  const [editingTask, setEditingTask] = useState<FoundationTaskItem | null>(null);
  const urgentApplications = applications.filter((item) => item.status === "review" || item.status === "clarify");
  const activeTasks = tasks.filter((task) => task.status === "published" || task.status === "returned");
  const saveTask = async (values: FoundationTaskFormValues) => {
    if (!editingTask) return;
    const updated = await tasksService.updateMyTask(editingTask.taskId, buildTaskUpdateRequest(values));
    await uploadTaskImageIfNeeded(updated.id, values);
    const submitted = await tasksService.submitMyTask(updated.id);
    setTasks((items) => items.map((task) => task.id === editingTask.id ? mapTaskResponseToFoundationTask(submitted) : task));
  };

  return (
    <FoundationPageShell
      eyebrow="Кабинет фонда"
      title="Управляйте помощью без лишней рутины"
      description="Создавайте задания, принимайте участников, подтверждайте факт участия и держите модерацию под контролем."
      action={<Link href="/foundation/create-task" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black shadow-[0_16px_38px_rgba(255,227,0,0.24)]"><Plus className="size-4" />Создать задание</Link>}
    >
      <Metrics metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <section className="space-y-4">
          <SectionHeader title="Задания, требующие внимания" text="Опубликованные активности и задания, которые нужно доработать после модерации." href="/foundation/tasks" />
          {loading ? <StateBlock title="Загружаем задания..." /> : error ? <StateBlock title="Не удалось загрузить кабинет" text={error} /> : activeTasks.length ? activeTasks.slice(0, 3).map((task) => <FoundationTaskCard key={task.id} task={task} onEdit={setEditingTask} />) : <StateBlock title="Нет заданий, требующих внимания" text="Опубликованные и возвращённые на доработку задания появятся здесь." />}
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-[1.6rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
            <div className="bg-brand p-5">
              <ShieldCheck className="size-7" />
              <h2 className="mt-4 text-2xl font-black leading-tight">{foundation.trust}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-black/60">Можно создавать задания. Каждая публикация всё равно проходит модерацию администратора.</p>
            </div>
            <div className="p-5">
              <Link href="/foundation/moderation" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#fffdf7] text-xs font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)]">
                Проверить статусы публикаций
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[1.6rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
            <SectionHeader title="Ожидают решения" text="Заявки, которые нельзя оставлять без ответа." href="/foundation/participants" compact />
            <div className="mt-4 space-y-3">
              {loading ? <StateBlock title="Загружаем отклики..." /> : urgentApplications.length ? urgentApplications.map((item) => (
                <Link key={item.id} href="/foundation/participants" className="block rounded-[1.15rem] bg-[#fffdf7] p-4 transition hover:bg-brand/12">
                  <p className="text-sm font-black">{item.volunteer}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-black/48">{item.taskTitle}</p>
                </Link>
              )) : <StateBlock title="Нет срочных откликов" text="Новые заявки волонтёров появятся в этом блоке." />}
            </div>
          </section>
        </aside>
      </div>
      {editingTask ? <FoundationTaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
    </FoundationPageShell>
  );
}

export function FoundationTasksPage() {
  const { error, loading, setTasks, tasks } = useFoundationWorkspaceData();
  const [activeStatus, setActiveStatus] = useState<"all" | FoundationTaskStatus>("all");
  const [editingTask, setEditingTask] = useState<FoundationTaskItem | null>(null);
  const visibleTasks = activeStatus === "all" ? tasks : tasks.filter((task) => task.status === activeStatus);

  useEffect(() => {
    setActiveStatus(normalizeTaskStatus(new URLSearchParams(window.location.search).get("status")));
  }, []);

  const saveTask = async (values: FoundationTaskFormValues) => {
    if (!editingTask) return;
    const updated = await tasksService.updateMyTask(editingTask.taskId, buildTaskUpdateRequest(values));
    await uploadTaskImageIfNeeded(updated.id, values);
    const submitted = await tasksService.submitMyTask(updated.id);
    setTasks((items) => items.map((task) => task.id === editingTask.id ? mapTaskResponseToFoundationTask(submitted) : task));
  };

  return (
    <FoundationPageShell
      eyebrow="Задания фонда"
      title="Публикации и модерация"
      description="Здесь фонд создаёт задания, редактирует черновики, отправляет на модерацию, дорабатывает и закрывает активности."
      action={<Link href="/foundation/create-task" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black"><Plus className="size-4" />Новое задание</Link>}
    >
      <TaskStatusFilters active={activeStatus} onChange={setActiveStatus} />
      <div className="space-y-4">
        {loading ? <StateBlock title="Загружаем задания..." /> : error ? <StateBlock title="Не удалось загрузить задания" text={error} /> : visibleTasks.length ? visibleTasks.map((task) => <FoundationTaskCard key={task.id} task={task} onEdit={setEditingTask} />) : <StateBlock title="Заданий с таким статусом нет" />}
      </div>
      {editingTask ? <FoundationTaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
    </FoundationPageShell>
  );
}

export function CreateTaskPage() {
  const router = useRouter();
  const { error, foundation, loading } = useFoundationWorkspaceData();
  const [categories, setCategories] = useState<HelpCategoryResponse[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillOptionResponse[]>([]);
  const [filterOptions, setFilterOptions] = useState<TaskFilterOptionsResponse | null>(null);
  const [, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      tasksService.getTaskCategories(),
      tasksService.getTaskSkills(),
      tasksService.getTaskFilters()
    ])
      .then(([categoryResponses, skillResponses, taskFilterResponses]) => {
        setCategories(categoryResponses);
        setSkillOptions(skillResponses);
        setFilterOptions(taskFilterResponses);
      })
      .catch((categoryError) => setCategoriesError(getApiErrorMessage(categoryError)));
  }, []);

  const createTask = async (values: FoundationTaskFormValues) => {
    const created = await tasksService.createTask(buildTaskCreateRequest(values));
    await uploadTaskImageIfNeeded(created.id, values);
    await tasksService.submitMyTask(created.id);
    window.setTimeout(() => router.push("/foundation/tasks?status=moderation"), 650);
  };

  return (
    <FoundationPageShell
      eyebrow="Создание задания"
      title="Новая активность для волонтёров"
      description="Опишите неденежную помощь, требования, сроки, контакты после принятия и ожидаемый результат."
    >
      {loading ? <StateBlock title="Загружаем данные фонда..." /> : error ? <StateBlock title="Не удалось загрузить данные фонда" text={error} /> : (
        <>
          <CreateTaskForm
            canPublish={foundation.moderationStatus === "approved"}
            categoryOptions={categories}
            durationOptions={filterOptions?.duration_types}
            formatOptions={filterOptions?.participation_formats}
            skillOptions={skillOptions.length ? skillOptions : undefined}
            taskTypeOptions={filterOptions?.task_types}
            onSubmit={createTask}
          />
        </>
      )}
    </FoundationPageShell>
  );
}

export function FoundationParticipantsPage() {
  const { applications, error, loading, setApplications, setTasks, tasks } = useFoundationWorkspaceData();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<ApplicationQueue>("review");

  const setApplicationStatus = async (id: string, status: FoundationApplicationStatus, comment?: string) => {
    setActionError(null);

    try {
      if (status === "clarify") {
        const updatedApplication = await applicationsService.clarifyFundApplication(id, { fund_comment: comment?.trim() || "Фонд просит уточнить детали участия." });
        const mappedApplication = mapApplicationResponseToFoundationApplication(updatedApplication);
        setApplications((items) => items.map((item) => item.id === id ? mappedApplication : item));
        return;
      }

      if (status === "not_completed") {
        const updatedApplication = await applicationsService.markFundApplicationNotCompleted(id, { completion_comment: comment?.trim() || "Фонд отметил, что участие не выполнено." });
        const mappedApplication = mapApplicationResponseToFoundationApplication(updatedApplication);
        setApplications((items) => items.map((item) => item.id === id ? mappedApplication : item));
        return;
      }

      const statusComment = comment?.trim();
      const updatedApplication = status === "accepted"
        ? await applicationsService.acceptFundApplication(id, { fund_comment: statusComment || "Заявка принята фондом." })
        : status === "rejected"
          ? await applicationsService.rejectFundApplication(id, { fund_comment: statusComment || "Заявка отклонена фондом." })
          : await applicationsService.confirmFundApplicationCompletion(id, { completion_comment: statusComment || "Участие подтверждено фондом." });
      const mappedApplication = mapApplicationResponseToFoundationApplication(updatedApplication);

      setApplications((items) => items.map((item) => item.id === id ? mappedApplication : item));
    } catch (statusError) {
      setActionError(toApplicationActionMessage(statusError));
    }
  };
  const closeTask = async (task: FoundationTaskItem) => {
    setActionError(null);

    try {
      await tasksService.closeMyTask(task.taskId);
      setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: "completed" } : item));
    } catch (closeError) {
      setActionError(toApplicationActionMessage(closeError));
    }
  };
  const tasksWithApplications = tasks.filter((task) => applications.some((item) => item.taskId === task.taskId || item.taskTitle === task.title));
  const orphanApplications = applications.filter((item) => !tasks.some((task) => item.taskId === task.taskId || item.taskTitle === task.title));
  const visibleApplications = applications.filter((item) => isApplicationInQueue(item, activeQueue));

  return (
    <FoundationPageShell
      eyebrow="Отклики и участие"
      title="Участники заданий"
      description="Единый рабочий раздел: рассмотрите отклики, запросите уточнение, примите участника и после активности подтвердите факт участия."
    >
      <div className="space-y-5">
        <ApplicationQueueFilters active={activeQueue} applications={applications} onChange={setActiveQueue} />
        {loading ? <StateBlock title="Загружаем участников..." /> : error ? <StateBlock title="Не удалось загрузить участников" text={error} /> : actionError ? <StateBlock title="Действие пока недоступно" text={actionError} /> : null}
        {!loading && !error && !applications.length ? <StateBlock title="Откликов пока нет" text="Когда волонтёры откликнутся на задания фонда, они появятся здесь." /> : null}
        {tasksWithApplications.map((task) => {
          const taskApplications = visibleApplications.filter((item) => item.taskId === task.taskId || item.taskTitle === task.title);
          if (!taskApplications.length) return null;
          return <TaskApplicationsSection key={task.id} task={task} applications={taskApplications} onCloseTask={closeTask} onStatusChange={setApplicationStatus} />;
        })}
        {!loading && !error && orphanApplications.filter((item) => isApplicationInQueue(item, activeQueue)).length ? <TaskApplicationsSection task={fallbackParticipantsTask} applications={orphanApplications.filter((item) => isApplicationInQueue(item, activeQueue))} onStatusChange={setApplicationStatus} /> : null}
        {!loading && !error && applications.length && !visibleApplications.length ? <StateBlock title="В этой группе откликов нет" text="Переключите фильтр, чтобы посмотреть другие статусы." /> : null}
      </div>
    </FoundationPageShell>
  );
}

export const FoundationApplicationsPage = FoundationParticipantsPage;
export const FoundationVolunteersPage = FoundationParticipantsPage;

export function FoundationNotificationsPage() {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await notificationsService.getRoleNotifications("foundation", { limit: 100 });
      setItems(response);
      setError(null);
    } catch (notificationError) {
      setError(getApiErrorMessage(notificationError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  async function markRead(item: NotificationResponse) {
    if (item.is_read) return;
    try {
      const updated = await notificationsService.markRoleNotificationRead("foundation", item.id);
      setItems((current) => current.map((notification) => notification.id === item.id ? updated : notification));
      setError(null);
    } catch (readError) {
      setError(getApiErrorMessage(readError));
    }
  }

  async function markAllRead() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllRoleNotificationsRead("foundation");
      setItems((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setError(null);
    } catch (readError) {
      setError(getApiErrorMessage(readError));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <FoundationPageShell
      eyebrow="Уведомления"
      title="События фонда"
      description="Здесь собраны решения по модерации, новые отклики, завершения заданий и начисление часов."
    >
      <div className="space-y-4">
        <section className="flex flex-wrap items-center gap-2 rounded-[1.45rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <FoundationStatusBadge tone="gold">Новые {unreadCount}</FoundationStatusBadge>
          <FoundationStatusBadge tone="neutral">Всего {items.length}</FoundationStatusBadge>
          <button onClick={() => { void markAllRead(); }} disabled={!unreadCount || markingAll} className="ml-auto h-10 rounded-xl bg-[#fffdf7] px-4 text-xs font-black text-black/58 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:bg-brand/12 disabled:opacity-55">
            {markingAll ? "Отмечаем..." : "Отметить все прочитанными"}
          </button>
        </section>
        {loading ? <StateBlock title="Загружаем уведомления..." /> : error ? <StateBlock title="Не удалось загрузить уведомления" text={error} /> : null}
        {!loading && !error && !items.length ? <StateBlock title="Уведомлений пока нет" text="Когда появятся новые события по заданиям и откликам, они будут здесь." /> : null}
        <div className="grid gap-3">
          {items.map((item) => (
            <button key={item.id} onClick={() => { void markRead(item); }} className={`grid gap-3 rounded-[1.35rem] bg-white p-4 text-left shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] transition hover:-translate-y-0.5 hover:bg-brand/10 md:grid-cols-[1fr_auto] md:items-center ${item.is_read ? "opacity-70" : ""}`}>
              <span>
                <span className="block text-sm font-black">{item.title}</span>
                <span className="mt-1 block whitespace-pre-line text-sm font-bold leading-6 text-black/54">{item.body}</span>
              </span>
              <span className="rounded-full bg-[#fffdf7] px-3 py-1.5 text-xs font-black text-black/44">{formatNotificationDate(item.created_at)}</span>
            </button>
          ))}
        </div>
      </div>
    </FoundationPageShell>
  );
}

export function FoundationModerationPage() {
  const { error, loading, setTasks, tasks } = useFoundationWorkspaceData();
  const [activeStatus, setActiveStatus] = useState<"all" | FoundationTaskStatus>("all");
  const [editingTask, setEditingTask] = useState<FoundationTaskItem | null>(null);
  const moderationTasks = tasks;
  const visibleTasks = activeStatus === "all" ? moderationTasks : moderationTasks.filter((task) => task.status === activeStatus);
  const saveTask = async (values: FoundationTaskFormValues) => {
    if (!editingTask) return;
    const updated = await tasksService.updateMyTask(editingTask.taskId, buildTaskUpdateRequest(values));
    await uploadTaskImageIfNeeded(updated.id, values);
    const submitted = await tasksService.submitMyTask(updated.id);
    setTasks((items) => items.map((task) => task.id === editingTask.id ? mapTaskResponseToFoundationTask(submitted) : task));
  };

  return (
    <FoundationPageShell
      eyebrow="Модерация"
      title="Статусы публикаций"
      description="Понимайте, что уже опубликовано, что ожидает проверки, а что нужно доработать и отправить повторно."
    >
      <TaskStatusFilters active={activeStatus} onChange={setActiveStatus} />
      <div className="space-y-4">
        {loading ? <StateBlock title="Загружаем модерацию..." /> : error ? <StateBlock title="Не удалось загрузить статусы модерации" text={error} /> : visibleTasks.length ? visibleTasks.map((task) => <FoundationTaskCard key={task.id} task={task} onEdit={setEditingTask} />) : <StateBlock title="Заданий на модерации нет" />}
      </div>
      {editingTask ? <FoundationTaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
    </FoundationPageShell>
  );
}

export function FoundationReportsPage() {
  const { error, loading, reports } = useFoundationWorkspaceData();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const chartValues = reports.map((metric) => Math.max(12, Math.min(Number(metric.value.replace(",", ".")) || 0, 100)));
  const reportActions = [
    {
      id: "participants-csv",
      title: "CSV по участникам",
      text: "Отклики, выполненные задания и часы волонтёров фонда.",
      fileName: "fund-participants.csv",
      run: () => fundsService.downloadMyFundParticipantsReport("csv")
    },
    {
      id: "participants-xlsx",
      title: "Excel по участникам",
      text: "Таблица для внутренней отчётности фонда.",
      fileName: "fund-participants.xlsx",
      run: () => fundsService.downloadMyFundParticipantsReport("xlsx")
    },
    {
      id: "hours-xlsx",
      title: "Отчёт по часам",
      text: "Начисленные часы по месяцам.",
      fileName: "fund-hours.xlsx",
      run: () => fundsService.downloadMyFundHoursReport("xlsx")
    }
  ];

  async function downloadReport(action: (typeof reportActions)[number]) {
    setDownloading(action.id);
    setDownloadError(null);
    try {
      downloadBlob(await action.run(), action.fileName);
    } catch (downloadReportError) {
      setDownloadError(getApiErrorMessage(downloadReportError));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <FoundationPageShell
      eyebrow="Отчётность"
      title="Аналитика фонда"
      description="Следите за заданиями, откликами, принятыми участниками, завершёнными активностями и подтверждёнными часами."
    >
      {loading ? <StateBlock title="Загружаем отчёты..." /> : error ? <StateBlock title="Не удалось загрузить отчёты" text={error} /> : null}
      {downloadError ? <StateBlock title="Не удалось скачать отчёт" text={downloadError} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        {reports.map((metric) => <FoundationMetricCard key={metric.label} {...metric} />)}
      </div>
      <section className="grid gap-5 overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)] lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader title="Эффективность активностей" text="Динамика откликов и подтверждённых участий за последние месяцы." />
          <div className="mt-8 flex h-56 items-end gap-5 rounded-[1.35rem] bg-[#fffdf7] p-5">
            {chartValues.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${value * 2}px` }} />
                <span className="text-xs font-bold text-black/42">{reports[index]?.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fffdf7] p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Экспорт отчётов</p>
          <div className="mt-4 space-y-3">
            {reportActions.map((action) => (
              <button key={action.id} onClick={() => { void downloadReport(action); }} disabled={downloading !== null} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm font-black text-black/68 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:bg-brand/12 disabled:text-black/34">
                <span>
                  <span className="block">{downloading === action.id ? "Готовим..." : action.title}</span>
                  <span className="mt-1 block text-xs font-bold text-black/42">{action.text}</span>
                </span>
                <Download className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </FoundationPageShell>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function FoundationProfilePage() {
  const { documents, error, foundation, loading, metrics, profileForm, tasks } = useFoundationWorkspaceData();

  const saveProfile = async (form: Parameters<typeof buildFundUpdateRequest>[0]) => {
    const updatedProfile = await fundsService.updateMyFundProfile(buildFundUpdateRequest(form));
    return mapFundProfileToProfileForm(updatedProfile);
  };

  const uploadDocument = async (documentType: string, file: File) => {
    const document = await fundsService.uploadMyFundDocument({ documentType, file });
    return {
      id: document.document_type,
      title: document.document_type,
      description: "Документ фонда",
      fileUrl: document.file_url,
      fileName: document.file_url.split("/").pop() || document.file_url,
      status: "uploaded" as const
    };
  };

  const uploadLogo = async (file: File) => {
    const response = await fundsService.uploadMyFundLogo(file);
    return response.file_url;
  };

  const uploadCover = async (file: File) => {
    const response = await fundsService.uploadMyFundCover(file);
    return response.file_url;
  };

  return (
    <div className="space-y-6">
      {loading ? <StateBlock title="Загружаем профиль фонда..." /> : error ? <StateBlock title="Не удалось загрузить профиль фонда" text={error} /> : null}
      {profileForm ? (
        <FoundationProfileWorkspace
          foundation={foundation}
          initialDocuments={documents}
          initialProfile={profileForm}
          metrics={metrics}
          onSaveProfile={saveProfile}
          onUploadCover={uploadCover}
          onUploadDocument={uploadDocument}
          onUploadLogo={uploadLogo}
          tasks={tasks}
        />
      ) : null}
    </div>
  );
}

function FoundationPageShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-6 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-70 lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-gradient-to-r from-white via-white/82 to-transparent lg:block" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-black/58">{description}</p>
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}

function Metrics({ metrics = [] }: { metrics?: typeof foundationMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <FoundationMetricCard key={metric.label} {...metric} />)}
    </div>
  );
}

function StateBlock({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-5 text-sm font-bold leading-6 text-black/52 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <p className="font-black text-black">{title}</p>
      {text ? <p className="mt-1">{text}</p> : null}
    </div>
  );
}

type ApplicationQueue = "review" | "accepted" | "completion" | "closed" | "all";

function ApplicationQueueFilters({
  active,
  applications,
  onChange
}: {
  active: ApplicationQueue;
  applications: FoundationApplicationItem[];
  onChange: (queue: ApplicationQueue) => void;
}) {
  const filters: { label: string; value: ApplicationQueue }[] = [
    { label: "Новые", value: "review" },
    { label: "Принятые", value: "accepted" },
    { label: "Ждут подтверждения", value: "completion" },
    { label: "Завершённые", value: "closed" },
    { label: "Все", value: "all" }
  ];

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-[1.45rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      {filters.map((item) => {
        const count = applications.filter((application) => isApplicationInQueue(application, item.value)).length;
        return (
          <button key={item.value} onClick={() => onChange(item.value)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${active === item.value ? "bg-brand text-black shadow-[0_12px_24px_rgba(255,227,0,0.2)]" : "bg-[#faf9f4] text-black/58 hover:bg-brand/12 hover:text-black"}`}>
            {item.label}
            <span className="rounded-full bg-white/72 px-2 py-0.5 text-[11px]">{count}</span>
          </button>
        );
      })}
    </section>
  );
}

function isApplicationInQueue(item: FoundationApplicationItem, queue: ApplicationQueue) {
  if (queue === "all") return true;
  if (queue === "review") return item.status === "review" || item.status === "clarify";
  if (queue === "accepted") return item.status === "accepted";
  if (queue === "completion") return item.status === "completed";
  return item.status === "confirmed" || item.status === "not_completed" || item.status === "rejected";
}

function TaskApplicationsSection({
  task,
  applications,
  onCloseTask,
  onStatusChange
}: {
  task: FoundationTaskItem;
  applications: FoundationApplicationItem[];
  onCloseTask?: (task: FoundationTaskItem) => Promise<void> | void;
  onStatusChange: (id: string, status: FoundationApplicationStatus, comment?: string) => Promise<void> | void;
}) {
  const hasAccepted = applications.some((item) => item.status === "accepted");
  const canReviewApplications = task.status === "published";
  const canConfirmCompletions = task.status === "completed";
  const canManageParticipants = canReviewApplications || canConfirmCompletions;
  const canCloseForCompletion = canReviewApplications && hasAccepted;

  return (
    <section className="overflow-hidden rounded-[1.65rem] bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_20px_60px_rgba(34,28,8,0.05)]">
      <div className="grid gap-4 bg-[#fffdf7] p-4 lg:grid-cols-[1fr_220px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FoundationStatusBadge tone={task.status === "published" ? "green" : task.status === "completed" ? "neutral" : task.status === "returned" ? "violet" : "blue"}>{task.status === "published" ? "Опубликовано" : task.status === "completed" ? "Задание завершено" : task.status === "returned" ? "На доработке" : "На модерации"}</FoundationStatusBadge>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-black/50">{applications.length} отклика</span>
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight">{task.title}</h2>
          <p className="mt-2 text-sm font-bold text-black/50">{task.period} · {task.city} · {task.participants}/{task.capacity} участников</p>
        </div>
        <div className="space-y-2">
          {canCloseForCompletion ? (
            <button onClick={() => onCloseTask?.(task)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-xs font-black text-white">
              Закрыть и подтверждать
              <ArrowRight className="size-4" />
            </button>
          ) : null}
          <Link href="/foundation/tasks" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-black text-black">
            Открыть задание
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {!canManageParticipants ? (
          <StateBlock title={taskStatusUnavailableTitle(task.status)} text={taskStatusUnavailableText(task.status)} />
        ) : applications.map((item) => <FoundationApplicationCard key={item.id} item={item} task={task} onStatusChange={onStatusChange} />)}
      </div>
    </section>
  );
}

function taskStatusUnavailableTitle(status: FoundationTaskStatus) {
  const titles: Partial<Record<FoundationTaskStatus, string>> = {
    draft: "Задание ещё не отправлено на проверку",
    moderation: "Сейчас задание находится на проверке",
    rejected: "Задание отклонено",
    returned: "Задание нужно доработать"
  };
  return titles[status] ?? "Задание пока недоступно волонтёрам";
}

function taskStatusUnavailableText(status: FoundationTaskStatus) {
  const texts: Partial<Record<FoundationTaskStatus, string>> = {
    completed: "Можно посмотреть историю откликов и статусы уже назначенных участников.",
    draft: "Задание станет доступно волонтёрам после проверки и публикации.",
    moderation: "Задание станет доступно волонтёрам после публикации.",
    rejected: "Отклики и назначение участников для отклонённого задания недоступны.",
    returned: "После доработки и публикации можно будет работать с откликами."
  };
  return texts[status] ?? "Управление участниками откроется после публикации задания.";
}

function normalizeTaskStatus(value: string | null): "all" | FoundationTaskStatus {
  const statuses: FoundationTaskStatus[] = ["completed", "draft", "moderation", "published", "rejected", "returned"];
  return statuses.includes(value as FoundationTaskStatus) ? value as FoundationTaskStatus : "all";
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "сейчас";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(date);
}

function TaskStatusFilters({ active, onChange }: { active: "all" | FoundationTaskStatus; onChange: (status: "all" | FoundationTaskStatus) => void }) {
  const filters: { label: string; value: "all" | FoundationTaskStatus }[] = [
    { label: "Все", value: "all" },
    { label: "Черновики", value: "draft" },
    { label: "На модерации", value: "moderation" },
    { label: "Опубликовано", value: "published" },
    { label: "На доработке", value: "returned" },
    { label: "Завершено", value: "completed" }
  ];

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-[1.45rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      {filters.map((item) => (
        <button key={item.value} onClick={() => onChange(item.value)} className={`h-10 rounded-xl px-4 text-sm font-black transition ${active === item.value ? "bg-brand text-black shadow-[0_12px_24px_rgba(255,227,0,0.2)]" : "bg-[#faf9f4] text-black/58 hover:bg-brand/12 hover:text-black"}`}>{item.label}</button>
      ))}
    </section>
  );
}

function applicationCommentByStatus(status: FoundationApplicationStatus, comment?: string) {
  if (comment?.trim()) return comment.trim();
  const comments: Record<FoundationApplicationStatus, string> = {
    review: "Заявка ожидает решения фонда.",
    accepted: "Волонтёр назначен на задачу. Контакты и инструкции доступны.",
    clarify: "Фонд запросил уточнение перед финальным решением.",
    rejected: "Заявка отклонена с комментарием фонда.",
    completed: "Фонд подтвердил выполнение. Часы ожидают проверки.",
    confirmed: "Администратор начислил часы.",
    not_completed: "Участие закрыто как невыполненное с комментарием."
  };
  return comments[status];
}

function applicationNextStepByStatus(status: FoundationApplicationStatus) {
  const steps: Record<FoundationApplicationStatus, string> = {
    review: "Примите решение по заявке",
    accepted: "После завершения задания подтвердите выполнение участника",
    clarify: "Дождитесь ответа волонтёра",
    rejected: "Заявка закрыта",
    completed: "Ожидает начисления часов администратором",
    confirmed: "Часы начислены",
    not_completed: "Результат зафиксирован"
  };
  return steps[status];
}

function toApplicationActionMessage(error: unknown) {
  const message = getApiErrorMessage(error);
  if (message.includes("task must be closed before confirming volunteer completion")) return "Сначала завершите задание, после этого можно будет подтвердить участие волонтёров.";
  if (message.includes("task must be closed before marking not completed")) return "Сначала завершите задание, после этого можно будет отметить результат участия.";
  if (message.includes("completion can be confirmed only for accepted application")) return "Сначала назначьте волонтёра на задачу, после этого можно подтвердить выполнение.";
  if (message.includes("not completed can be set only for assigned participant")) return "Отметить результат можно только для назначенного участника.";
  if (message.includes("task is not open for accepting applications")) return "Задание пока недоступно для работы с участниками.";
  if (message.includes("invalid task status transition")) return "Статус задания не позволяет выполнить это действие.";
  return message;
}

function SectionHeader({ title, text, href, compact = false }: { title: string; text: string; href?: string; compact?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>{title}</h2>
        <p className="mt-1 max-w-xl text-sm font-bold leading-6 text-black/48">{text}</p>
      </div>
      {href ? <Link href={href} className="shrink-0 text-sm font-black text-black/48 hover:text-black">Открыть →</Link> : null}
    </div>
  );
}
