"use client";

import type { FormEvent, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Download, Inbox, ListChecks, UsersRound } from "lucide-react";
import { applicationApi, fundApi, taskApi } from "@/shared/api/services";
import { mapApiFundToFoundation } from "@/shared/api/mappers";
import type { Foundation } from "@/entities/foundation/model";
import type { ApiTask, TaskCreateRequest } from "@/shared/api/types";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

export function FoundationTasksPage() {
  const { foundation, tasks, isLoading } = useFoundationData();

  return (
    <FoundationShell title="Мои задания" description="Рабочая очередь фонда: черновики, модерация, публикация и закрытие активностей." foundation={foundation} tasks={tasks}>
      <EditorialList items={isLoading ? [] : tasks.map((task) => ({ title: task.title, meta: `${task.city ?? "Онлайн"} / ${task.expected_hours} часов`, text: task.moderation_comment ?? task.description, status: task.status }))} />
    </FoundationShell>
  );
}

export function CreateTaskPage() {
  const queryClient = useQueryClient();
  const { foundation, tasks } = useFoundationData();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "children",
    participation_format: "offline",
    duration_type: "one_time",
    city: "",
    location: "",
    starts_at: "",
    deadline_at: "",
    participant_limit: "5",
    expected_hours: "4",
    requirements: "",
    required_skills: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: TaskCreateRequest = {
        title: form.title,
        description: form.description,
        category: form.category as TaskCreateRequest["category"],
        participation_format: form.participation_format as TaskCreateRequest["participation_format"],
        duration_type: form.duration_type as TaskCreateRequest["duration_type"],
        task_type: form.required_skills.toLowerCase().includes("pro bono") ? "pro_bono" : "regular",
        city: form.participation_format === "offline" ? form.city : null,
        location: form.location || null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
        participant_limit: form.participant_limit ? Number(form.participant_limit) : null,
        expected_hours: Number(form.expected_hours).toFixed(2),
        requirements: form.requirements || null,
        required_skills: form.required_skills.split(",").map((item) => item.trim()).filter(Boolean)
      };
      const task = await taskApi.create(payload);
      return taskApi.submit(task.id);
    },
    onSuccess: async () => {
      setMessage("Задание отправлено на модерацию");
      await queryClient.invalidateQueries({ queryKey: ["tasks", "foundation"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Не удалось создать задание")
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void createMutation.mutateAsync();
  }

  return (
    <FoundationShell title="Создать задание" description="Большая форма публикации с контролем качества и запретом fundraising-активностей." foundation={foundation} tasks={tasks}>
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-3 rounded-[1.35rem] bg-white/68 p-5">
          <Field value={form.title} onChange={(value) => update("title", value)} placeholder="Название задания" required />
          <TextareaField value={form.description} onChange={(value) => update("description", value)} placeholder="Описание и ожидаемый результат" required />
          <SelectField value={form.category} onChange={(value) => update("category", value)} options={[["children", "Помощь детям"], ["elderly", "Пожилые люди"], ["disability", "Инклюзия"], ["ecology", "Экология"]]} />
          <SelectField value={form.participation_format} onChange={(value) => update("participation_format", value)} options={[["offline", "Офлайн"], ["online", "Онлайн"]]} />
          <SelectField value={form.duration_type} onChange={(value) => update("duration_type", value)} options={[["one_time", "Разовое"], ["regular", "Регулярное"], ["long_term", "Долгосрочное"]]} />
          <Field value={form.city} onChange={(value) => update("city", value)} placeholder="Город" />
          <Field value={form.location} onChange={(value) => update("location", value)} placeholder="Место / ссылка" />
          <Field value={form.starts_at} onChange={(value) => update("starts_at", value)} type="datetime-local" placeholder="Дата начала" />
          <Field value={form.deadline_at} onChange={(value) => update("deadline_at", value)} type="datetime-local" placeholder="Дедлайн отклика" />
          <Field value={form.participant_limit} onChange={(value) => update("participant_limit", value)} type="number" min="1" placeholder="Количество участников" />
          <Field value={form.expected_hours} onChange={(value) => update("expected_hours", value)} type="number" min="1" step="0.5" placeholder="Часы" required />
          <TextareaField value={form.requirements} onChange={(value) => update("requirements", value)} placeholder="Требования и инструкции" />
          <Field value={form.required_skills} onChange={(value) => update("required_skills", value)} placeholder="Навыки через запятую" />
        </div>
        <div className="space-y-4">
          <div className="gold-panel rounded-[1.35rem] p-5">
            <AlertTriangle className="size-8" />
            <h3 className="mt-4 text-xl font-black">Проверка fundraising</h3>
            <p className="mt-2 text-sm leading-6 text-black/64">Задачи про сбор денег, пожертвования и финансовые переводы не публикуются. Платформа поддерживает только волонтерское участие.</p>
          </div>
          {message ? <div className="rounded-[1.35rem] bg-white p-4 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">{message}</div> : null}
          <button disabled={createMutation.isPending} className="h-12 w-full rounded-2xl bg-brand text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] disabled:opacity-50">Отправить на модерацию</button>
        </div>
      </form>
    </FoundationShell>
  );
}

export function FoundationApplicationsPage() {
  const queryClient = useQueryClient();
  const { foundation, tasks, applications } = useFoundationData();
  const [error, setError] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: (id: string) => applicationApi.accept(id),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "foundation"] });
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось принять отклик")
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => applicationApi.reject(id, "Не подходит по требованиям задания"),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", "foundation"] });
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось отклонить отклик")
  });

  return (
    <FoundationShell title="Отклики волонтеров" description="Две стадии: принять отклик, а после активности подтвердить факт участия." foundation={foundation} tasks={tasks}>
      {error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      <div className="divide-y divide-black/8 overflow-hidden rounded-[1.35rem] bg-white/60">
        {applications.map((application) => (
          <article key={application.id} className="grid gap-3 p-4 transition hover:bg-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{application.task?.title ?? application.task_id}</p>
              <h3 className="mt-1 text-lg font-black">{application.volunteer?.full_name ?? application.volunteer?.email ?? application.volunteer_id}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">{application.volunteer_comment ?? application.fund_comment ?? "Комментарий не указан"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="muted">{application.status}</StatusPill>
              {application.status === "applied" ? (
                <>
                  <button onClick={() => acceptMutation.mutate(application.id)} className="h-9 rounded-xl bg-brand px-4 text-xs font-black text-black">Принять</button>
                  <button onClick={() => rejectMutation.mutate(application.id)} className="h-9 rounded-xl bg-white px-4 text-xs font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]">Отклонить</button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </FoundationShell>
  );
}

export function FoundationModerationPage() {
  const { foundation, fundProfile, tasks } = useFoundationData();
  const items = [
    { title: fundProfile?.name ?? foundation.name, meta: "fund", text: fundProfile?.moderation_comment ?? "Профиль фонда ожидает решения администратора или уже одобрен.", status: fundProfile?.status ?? foundation.moderationStatus },
    ...tasks.map((task) => ({ title: task.title, meta: task.status, text: task.moderation_comment ?? task.description, status: task.status }))
  ];
  return (
    <FoundationShell title="Модерация" description="Статусы профиля фонда и заданий приходят из backend." foundation={foundation} tasks={tasks}>
      <EditorialList items={items} />
    </FoundationShell>
  );
}

export function FoundationVolunteersPage() {
  const { foundation, tasks, applications } = useFoundationData();
  return (
    <FoundationShell title="Волонтеры" description="Люди, которые откликались, участвовали или ожидают решения по заданиям фонда." foundation={foundation} tasks={tasks}>
      <EditorialList items={applications.map((item) => ({ title: item.volunteer?.full_name ?? item.volunteer?.email ?? item.volunteer_id, meta: item.status, text: `Последняя активность: ${item.task?.title ?? item.task_id}.`, status: "профиль" }))} />
    </FoundationShell>
  );
}

export function FoundationReportsPage() {
  const { foundation, tasks, applications } = useFoundationData();
  return (
    <FoundationShell title="Отчеты" description="Экспорт активности фонда для внутренней отчетности и сверки подтверждений." foundation={foundation} tasks={tasks}>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Отклики", value: applications.length },
          { title: "Задания", value: tasks.length },
          { title: "Активные задания", value: foundation.activeTasks },
          { title: "Документы", value: foundation.reportsReady }
        ].map((item) => (
          <div key={item.title} className="flex items-center justify-between rounded-[1.35rem] bg-white/70 p-5">
            <div>
              <h3 className="text-lg font-black">{item.title}</h3>
              <p className="mt-1 text-sm text-black/52">{item.value}</p>
            </div>
            <Download className="size-6 text-black" />
          </div>
        ))}
      </div>
    </FoundationShell>
  );
}

export function FoundationProfilePage() {
  const queryClient = useQueryClient();
  const { foundation, fundProfile, tasks } = useFoundationData();
  const [documentType, setDocumentType] = useState("registration_certificate");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Выберите файл");
      return fundApi.uploadDocument({ documentType, file });
    },
    onSuccess: async () => {
      setMessage("Документ загружен");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["fund", "me"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Не удалось загрузить документ")
  });

  return (
    <FoundationShell title="Профиль фонда" description="Публичная карточка фонда для волонтеров и модерационный статус." foundation={foundation} tasks={tasks}>
      <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
        <StatusPill>{foundation.moderationStatus}</StatusPill>
        <h3 className="mt-5 text-3xl font-black text-black">{foundation.name}</h3>
        <p className="mt-3 max-w-2xl text-black/64">{foundation.focus}. Куратор: {foundation.curator}. Регион: {foundation.city}.</p>
        {fundProfile?.moderation_comment ? <p className="mt-4 rounded-xl bg-brand/16 p-4 text-sm font-bold text-black/66">{fundProfile.moderation_comment}</p> : null}
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-12 rounded-2xl bg-[#fffdf7] px-4 text-sm font-bold text-black/72 outline-none" />
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="h-12 rounded-2xl bg-[#fffdf7] px-4 py-3 text-sm font-bold text-black/72 outline-none" />
          <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} className="h-12 rounded-2xl bg-brand px-5 text-sm font-black text-black disabled:opacity-50">Загрузить</button>
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-black/58">{message}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {(fundProfile?.documents ?? []).map((document) => <StatusPill key={document.id} tone="muted">{document.document_type}</StatusPill>)}
        </div>
      </div>
    </FoundationShell>
  );
}

function FoundationShell({ title, description, foundation, tasks, children }: { title: string; description: string; foundation: Foundation; tasks: ApiTask[]; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Кабинет фонда" title={title} description={description} tone="gold" />
      <MetricStrip
        items={[
          { icon: ListChecks, value: `${foundation.activeTasks}`, label: "активных заданий" },
          { icon: Inbox, value: `${tasks.length}`, label: "всего заданий" },
          { icon: UsersRound, value: `${foundation.volunteersNeeded}`, label: "нужно участников" },
          { icon: CheckCircle2, value: `${foundation.responseRate}%`, label: "скорость ответа" }
        ]}
      />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}

function useFoundationData() {
  const fundQuery = useQuery({ queryKey: ["fund", "me"], queryFn: () => fundApi.me() });
  const tasksQuery = useQuery({ queryKey: ["tasks", "foundation"], queryFn: () => taskApi.listMine() });
  const applicationsQuery = useQuery({ queryKey: ["applications", "foundation"], queryFn: () => applicationApi.listFund() });
  const tasks = tasksQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const foundation = fundQuery.data ? mapApiFundToFoundation(fundQuery.data, tasks, applications) : emptyFoundation();

  return {
    applications,
    foundation,
    fundProfile: fundQuery.data,
    isLoading: fundQuery.isLoading || tasksQuery.isLoading || applicationsQuery.isLoading,
    tasks
  };
}

function emptyFoundation() {
  return {
    id: "",
    name: "Фонд",
    focus: "Данные фонда загружаются",
    city: "",
    activeTasks: 0,
    volunteersNeeded: 0,
    responseRate: 0,
    moderationStatus: "review" as const,
    curator: "",
    reportsReady: 0
  };
}

type FieldProps = { value: string; onChange: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;
type TextareaFieldProps = { value: string; onChange: (value: string) => void } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

function Field({ value, onChange, ...props }: FieldProps) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} className="block h-14 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black/72 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" {...props} />;
}

function TextareaField({ value, onChange, ...props }: TextareaFieldProps) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} className="block min-h-24 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black/72 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" {...props} />;
}

function SelectField({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="block h-14 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black/72 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  );
}
