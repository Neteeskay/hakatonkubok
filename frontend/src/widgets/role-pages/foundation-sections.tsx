import { AlertTriangle, CheckCircle2, Clock, Download, FileBarChart, Inbox, ListChecks, PlusCircle, ShieldCheck, UsersRound } from "lucide-react";
import { applications, foundations, tasks } from "@/shared/config/mock-data";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

const foundation = foundations[0];

export function FoundationTasksPage() {
  return (
    <FoundationShell title="Мои задания" description="Рабочая очередь фонда: черновики, модерация, публикация и закрытие активностей.">
      <EditorialList items={tasks.map((task) => ({ title: task.title, meta: `${task.city} / ${task.hours} часов`, text: task.impact, status: task.status === "open" ? "published" : "sent to moderation" }))} />
    </FoundationShell>
  );
}

export function CreateTaskPage() {
  return (
    <FoundationShell title="Создать задание" description="Большая форма публикации с контролем качества и запретом fundraising-активностей.">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-3 rounded-[1.35rem] bg-white/68 p-5">
          {["Название задания", "Описание и ожидаемый результат", "Категория помощи", "Формат участия", "Город / место / ссылка", "Дедлайн и периодичность", "Количество участников", "Требования и навыки", "Инструкции и материалы"].map((field) => (
            <label key={field} className="block rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">{field}</label>
          ))}
        </div>
        <div className="space-y-4">
          <div className="gold-panel rounded-[1.35rem] p-5">
            <AlertTriangle className="size-8" />
            <h3 className="mt-4 text-xl font-black">Проверка fundraising</h3>
            <p className="mt-2 text-sm leading-6 text-black/64">Задачи про сбор денег, пожертвования и финансовые переводы не публикуются. Платформа поддерживает только волонтёрское участие.</p>
          </div>
          <button className="h-12 w-full rounded-2xl bg-brand text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.28)]">Отправить на модерацию</button>
        </div>
      </div>
    </FoundationShell>
  );
}

export function FoundationApplicationsPage() {
  return (
    <FoundationShell title="Отклики волонтёров" description="Две стадии: принять отклик, а после активности подтвердить факт участия. Часы начисляет только администратор.">
      <EditorialList items={applications.map((item) => ({ title: item.volunteer, meta: item.task, text: `${item.hours} часов. Решение фонда влияет на допуск к участию, но не начисляет часы.`, status: item.status }))} />
    </FoundationShell>
  );
}

export function FoundationModerationPage() {
  return (
    <FoundationShell title="Модерация" description="Статусы заданий: draft, sent to moderation, returned, approved, published, closed.">
      <EditorialList
        items={[
          { title: "Наставничество по digital-профессиям", meta: "returned", text: "Администратор просит уточнить материалы и контакт после отклика.", status: "нужны правки" },
          { title: "Медиакит для благотворительного забега", meta: "approved", text: "Задание одобрено и готово к публикации.", status: "одобрено" },
          { title: "Сортировка наборов для приютов", meta: "published", text: "Идёт набор участников.", status: "опубликовано" }
        ]}
      />
    </FoundationShell>
  );
}

export function FoundationVolunteersPage() {
  return (
    <FoundationShell title="Волонтёры" description="Люди, которые откликались, участвовали или ожидают решения по заданиям фонда.">
      <EditorialList items={applications.map((item) => ({ title: item.volunteer, meta: item.status, text: `Последняя активность: ${item.task}. Ожидаемый вклад: ${item.hours} часов.`, status: "профиль" }))} />
    </FoundationShell>
  );
}

export function FoundationReportsPage() {
  return (
    <FoundationShell title="Отчёты" description="Экспорт активности фонда для внутренней отчётности и сверки подтверждений.">
      <div className="grid gap-4 md:grid-cols-2">
        {["CSV по откликам", "Excel по участникам", "Отчёт по часам", "Сводка по заданиям"].map((title) => (
          <div key={title} className="flex items-center justify-between rounded-[1.35rem] bg-white/70 p-5">
            <div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-1 text-sm text-black/52">Готов к выгрузке</p>
            </div>
            <Download className="size-6 text-black" />
          </div>
        ))}
      </div>
    </FoundationShell>
  );
}

export function FoundationProfilePage() {
  return (
    <FoundationShell title="Профиль фонда" description="Публичная карточка фонда для волонтёров и модерационный статус.">
      <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
        <StatusPill>{foundation.moderationStatus}</StatusPill>
        <h3 className="mt-5 text-3xl font-black text-black">{foundation.name}</h3>
        <p className="mt-3 max-w-2xl text-black/64">{foundation.focus}. Куратор: {foundation.curator}. Регион: {foundation.city}.</p>
      </div>
    </FoundationShell>
  );
}

function FoundationShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Кабинет фонда" title={title} description={description} tone="gold" />
      <MetricStrip
        items={[
          { icon: ListChecks, value: `${foundation.activeTasks}`, label: "активных заданий" },
          { icon: Inbox, value: "27", label: "откликов" },
          { icon: UsersRound, value: `${foundation.volunteersNeeded}`, label: "нужно участников" },
          { icon: CheckCircle2, value: `${foundation.responseRate}%`, label: "скорость ответа" }
        ]}
      />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}
