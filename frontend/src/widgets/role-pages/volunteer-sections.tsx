import { Award, Bell, Clock, History, Inbox, UserRound } from "lucide-react";
import { applications, tasks, volunteers } from "@/shared/config/mock-data";
import { EditorialList, MetricStrip, ProductPanel, RoleHero, StatusPill } from "@/widgets/role-pages/role-page-shell";

const volunteer = volunteers[0];

export function ApplicationsPage() {
  return (
    <VolunteerSectionShell
      icon="Отклики"
      title="Мои отклики"
      description="Каждый отклик показывает, на каком шаге он находится и что нужно сделать дальше."
      metrics={[
        { icon: Inbox, value: "4", label: "активных отклика" },
        { icon: Clock, value: "13", label: "часов в ожидании" },
        { icon: Award, value: "2", label: "принято фондом" },
        { icon: Bell, value: "1", label: "требует ответа" }
      ]}
    >
      <EditorialList
        items={[
          { title: "Сопровождение семейного спортивного дня", meta: "pending", text: "Фонд проверяет состав команды. Ответ ожидается до 22 мая.", status: "ожидает решения" },
          { title: "Медиакит для благотворительного забега", meta: "accepted", text: "Координатор отправил материалы и ждёт первый черновик.", status: "принято" },
          { title: "Наставничество по digital-профессиям", meta: "in progress", text: "Назначены две встречи, часы будут подтверждены после финального отчёта.", status: "в работе" },
          { title: "Сбор школьных наборов", meta: "hours added", text: "Участие подтверждено фондом и администратором. Часы начислены.", status: "часы начислены" }
        ]}
      />
    </VolunteerSectionShell>
  );
}

export function HistoryPage() {
  return (
    <VolunteerSectionShell
      icon="История"
      title="История помощи"
      description="Завершённые участия, подтверждения фондов и вклад по категориям."
      metrics={[
        { icon: History, value: `${volunteer.completedTasks}`, label: "дел завершено" },
        { icon: Clock, value: `${volunteer.hours}`, label: "часов подтверждено" },
        { icon: Award, value: "3", label: "категории вклада" },
        { icon: UserRound, value: "100%", label: "участий закрыто" }
      ]}
    >
      <EditorialList
        items={volunteer.history.map((item) => ({
          title: item.title,
          meta: `${item.date} / ${item.hours} часов`,
          text: "Фонд подтвердил участие, администратор добавил часы в личную статистику.",
          status: item.status
        }))}
      />
    </VolunteerSectionShell>
  );
}

export function HoursPage() {
  return (
    <VolunteerSectionShell
      icon="Часы"
      title="Волонтёрские часы"
      description="Часы не начисляются автоматически: фонд подтверждает участие, администратор проверяет и добавляет их в профиль."
      metrics={[
        { icon: Clock, value: "46", label: "начислено" },
        { icon: Inbox, value: "8", label: "ожидает фонда" },
        { icon: Bell, value: "5", label: "ожидает админа" },
        { icon: Award, value: "60", label: "цель квартала" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {["Фонд подтвердил участие", "Администратор проверяет", "Часы начислены"].map((step, index) => (
          <div key={step} className="rounded-[1.35rem] bg-white/68 p-5">
            <StatusPill tone={index === 2 ? "green" : "gold"}>Шаг {index + 1}</StatusPill>
            <h3 className="mt-4 text-xl font-black">{step}</h3>
            <p className="mt-2 text-sm leading-6 text-black/58">{index === 0 ? "Координатор фиксирует факт участия." : index === 1 ? "Проверяются даты, часы и статус задания." : "Вклад попадает в профиль и отчёты."}</p>
          </div>
        ))}
      </div>
    </VolunteerSectionShell>
  );
}

export function AchievementsPage() {
  return (
    <VolunteerSectionShell
      icon="Достижения"
      title="Достижения"
      description="Взрослая мотивация без игрового шума: статус, прогресс и значимые milestones."
      metrics={[
        { icon: Award, value: volunteer.level, label: "статус" },
        { icon: Clock, value: "77%", label: "цель квартала" },
        { icon: UserRound, value: "3", label: "бейджа" },
        { icon: Bell, value: "1", label: "новая цель" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {volunteer.achievements.map((achievement) => (
          <div key={achievement} className="gold-panel rounded-[1.35rem] p-5">
            <Award className="size-8" />
            <h3 className="mt-5 text-xl font-black">{achievement}</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">Засчитывается в корпоративный вклад и личный профиль.</p>
          </div>
        ))}
      </div>
    </VolunteerSectionShell>
  );
}

export function NotificationsPage() {
  return (
    <VolunteerSectionShell
      icon="Уведомления"
      title="Уведомления"
      description="Только полезные статусы: решения фондов, подтверждения часов и важные дедлайны."
      metrics={[
        { icon: Bell, value: "2", label: "новых" },
        { icon: Inbox, value: "1", label: "по откликам" },
        { icon: Clock, value: "1", label: "по часам" },
        { icon: Award, value: "0", label: "без спама" }
      ]}
    >
      <EditorialList
        items={volunteer.notifications.map((item) => ({
          title: item.title,
          meta: "сегодня",
          text: item.text,
          status: "прочитать"
        }))}
      />
    </VolunteerSectionShell>
  );
}

export function ProfilePage() {
  return (
    <VolunteerSectionShell
      icon="Профиль"
      title="Профиль волонтёра"
      description="Данные сотрудника подтянуты из demo-профиля. В кабинете можно менять город, навыки, интересы и контакты."
      metrics={[
        { icon: UserRound, value: volunteer.city, label: "город" },
        { icon: Clock, value: `${volunteer.hours}`, label: "часов" },
        { icon: Award, value: volunteer.level, label: "статус" },
        { icon: Inbox, value: `${volunteer.activeTaskIds.length}`, label: "активных задания" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
          <div className="grid size-20 place-items-center rounded-3xl bg-brand text-2xl font-black text-black">АС</div>
          <h3 className="mt-5 text-2xl font-black text-black">{volunteer.name}</h3>
          <p className="mt-1 text-black/58">{volunteer.role}, {volunteer.department}</p>
        </div>
        <div className="rounded-[1.35rem] bg-white/68 p-5">
          <h3 className="text-xl font-black">Навыки и интересы</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {volunteer.interests.map((interest) => <StatusPill key={interest}>{interest}</StatusPill>)}
            {tasks[0].skills.map((skill) => <StatusPill key={skill} tone="muted">{skill}</StatusPill>)}
          </div>
        </div>
      </div>
    </VolunteerSectionShell>
  );
}

function VolunteerSectionShell({
  icon,
  title,
  description,
  metrics,
  children
}: {
  icon: string;
  title: string;
  description: string;
  metrics: Parameters<typeof MetricStrip>[0]["items"];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow={icon} title={title} description={description} tone="light" />
      <MetricStrip items={metrics} />
      <ProductPanel title={title}>{children}</ProductPanel>
    </div>
  );
}
