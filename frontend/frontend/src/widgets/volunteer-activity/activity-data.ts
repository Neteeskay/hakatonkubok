import { Bell, CalendarClock, CheckCircle2, Clock, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { tasks } from "@/shared/config/mock-data";
import type { ApplicationStatus } from "@/widgets/task-detail/model/participation-flow";

export type VolunteerApplicationStage = "pending" | "accepted" | "in-progress" | "completed" | "hours" | "rejected";

export interface VolunteerApplicationItem {
  id: string;
  task: VolunteerTask;
  stage: VolunteerApplicationStage;
  detailStatus: ApplicationStatus;
  title: string;
  statusLabel: string;
  stageLabel: string;
  eventDate: string;
  appliedAt: string;
  deadline: string;
  progress: number;
  nextAction: string;
  message: string;
  foundationComment?: string;
  contactUnlocked: boolean;
  contact?: {
    name: string;
    role: string;
    email: string;
    phone: string;
    telegram: string;
    whatsapp: string;
    chat: string;
    instruction: string;
  };
}

export const statusFilters = [
  { label: "Все отклики", value: "all" },
  { label: "На рассмотрении", value: "pending" },
  { label: "Приняты", value: "accepted" },
  { label: "В работе", value: "in-progress" },
  { label: "Завершены", value: "completed" },
  { label: "Отклонены", value: "rejected" }
] as const;

export const applicationItems: VolunteerApplicationItem[] = [
  {
    id: "app-sport-day",
    task: tasks[0],
    stage: "pending",
    detailStatus: "pending",
    title: "Ожидается решение фонда",
    statusLabel: "На рассмотрении",
    stageLabel: "Фонд проверяет состав команды",
    eventDate: "24 мая 2026, 10:00",
    appliedAt: "20 мая 2026",
    deadline: "Ответ до 22 мая",
    progress: 30,
    nextAction: "Пока ничего делать не нужно",
    message: "Фонд обычно отвечает в течение 2-3 дней. Если вас примут, здесь появятся контакты и инструкции.",
    contactUnlocked: false
  },
  {
    id: "app-media-kit",
    task: tasks[1],
    stage: "accepted",
    detailStatus: "accepted",
    title: "Вы приняты к участию",
    statusLabel: "Принят",
    stageLabel: "Контакты и материалы доступны",
    eventDate: "27 мая 2026",
    appliedAt: "18 мая 2026",
    deadline: "Первый черновик до 28 мая",
    progress: 58,
    nextAction: "Связаться с координатором и согласовать формат медиакита",
    message: "Координатор ждёт первый черновик и готов ответить на вопросы по бренд-пакету.",
    contactUnlocked: true,
    contact: {
      name: "Елена Полякова",
      role: "PR-менеджер фонда",
      email: "volunteer@life-line.ru",
      phone: "+7 916 503-20-11",
      telegram: "@life_run_help",
      whatsapp: "+7 916 503-20-11",
      chat: "Чат проекта «Медиакит забега»",
      instruction: "Напишите Елене в Telegram, получите бренд-пакет и согласуйте структуру презентации."
    }
  },
  {
    id: "app-mentoring",
    task: tasks[2],
    stage: "in-progress",
    detailStatus: "accepted",
    title: "Задание в процессе",
    statusLabel: "В работе",
    stageLabel: "Следующая встреча 30 мая",
    eventDate: "30 мая 2026, 18:30",
    appliedAt: "14 мая 2026",
    deadline: "Финальная встреча 13 июня",
    progress: 72,
    nextAction: "Подготовить 3 рабочих примера для подростков",
    message: "Добавьте дату в календарь и не забудьте взять ноутбук для практической части.",
    contactUnlocked: true,
    contact: {
      name: "Илья Орлов",
      role: "Программный менеджер",
      email: "team@chance-edu.ru",
      phone: "+7 921 440-17-09",
      telegram: "@chance_mentor",
      whatsapp: "+7 921 440-17-09",
      chat: "Чат наставников «Шанс»",
      instruction: "В рабочем чате закреплены расписание встреч, шаблон обратной связи и список групп."
    }
  },
  {
    id: "app-kits",
    task: tasks[3],
    stage: "hours",
    detailStatus: "hours",
    title: "Часы начислены",
    statusLabel: "Часы начислены",
    stageLabel: "Участие подтверждено фондом и администратором",
    eventDate: "1 июня 2026, 12:00",
    appliedAt: "12 мая 2026",
    deadline: "Завершено",
    progress: 100,
    nextAction: "Можно добавить опыт в историю профиля",
    message: "4 волонтёрских часа добавлены в профиль и попадут в отчётность компании.",
    contactUnlocked: true,
    contact: {
      name: "Наталья Хасанова",
      role: "Координатор сборов",
      email: "help@warm-city.ru",
      phone: "+7 987 118-09-20",
      telegram: "@warm_city_help",
      whatsapp: "+7 987 118-09-20",
      chat: "Архивный чат сортировки",
      instruction: "Фонд подтвердил участие. Дополнительных действий не требуется."
    }
  },
  {
    id: "app-audit",
    task: tasks[4],
    stage: "rejected",
    detailStatus: "rejected",
    title: "Отклик не принят",
    statusLabel: "Отклонён",
    stageLabel: "Комментарий фонда",
    eventDate: "3 июня 2026",
    appliedAt: "10 мая 2026",
    deadline: "Отклонено 12 мая",
    progress: 100,
    nextAction: "Можно откликнуться на другие pro bono задания",
    message: "Фонд выбрал участника с более релевантным опытом для работы с чувствительными данными.",
    foundationComment: "Сейчас нужен волонтёр с опытом UX-исследований от 3 лет и NDA-проектами.",
    contactUnlocked: false
  }
];

export const applicationFlow = [
  { key: "sent", label: "Отклик отправлен", helper: "Заявка принята к рассмотрению организатором", tone: "gold" },
  { key: "pending", label: "На рассмотрении", helper: "Фонд рассматривает вашу заявку", tone: "blue" },
  { key: "accepted", label: "Принят", helper: "Вас приняли к участию", tone: "green" },
  { key: "in-progress", label: "В работе", helper: "Вы участвуете в выполнении задания", tone: "violet" },
  { key: "completed", label: "Завершён", helper: "Ожидается подтверждение от фонда", tone: "mint" },
  { key: "hours", label: "Часы начислены", helper: "Волонтёрские часы начислены на ваш счёт", tone: "cream" }
] as const;

export const historyItems = [
  { month: "Май 2026", task: tasks[3], status: "Выполнено", hours: 4, result: "Коробки собраны и переданы доставке", achievement: "Надёжный участник" },
  { month: "Май 2026", task: tasks[1], status: "Часы подтверждены", hours: 6, result: "Медиакит передан фонду", achievement: "Pro bono вклад" },
  { month: "Март 2026", task: tasks[2], status: "Выполнено", hours: 4, result: "Подростки прошли карьерную встречу", achievement: "Командный игрок" },
  { month: "Март 2026", task: tasks[0], status: "Подтверждено фондом", hours: 2, result: "Ожидает начисления часов администратором", achievement: "События" }
];

export const notificationGroups = [
  {
    title: "Сегодня",
    items: [
      { icon: CheckCircle2, title: "Заявка принята", text: "Фонд «Линия жизни» принял вас на медиакит для забега.", time: "12:40", unread: true, tone: "green" },
      { icon: MessageCircle, title: "Комментарий фонда", text: "Координатор попросил прислать один пример презентации.", time: "10:18", unread: true, tone: "violet" },
      { icon: CalendarClock, title: "Напоминание", text: "Спортивный день начнётся 24 мая в 10:00.", time: "09:00", unread: false, tone: "gold" }
    ]
  },
  {
    title: "Вчера",
    items: [
      { icon: Clock, title: "Начислены часы", text: "4 часа добавлены за участие в медиаподдержке.", time: "18:20", unread: false, tone: "gold" },
      { icon: RefreshCw, title: "Изменение задания", text: "Фонд обновил инструкции к наставничеству.", time: "15:04", unread: false, tone: "blue" },
      { icon: XCircle, title: "Заявка отклонена", text: "Фонд «Добрые решения» оставил комментарий к отклику.", time: "11:30", unread: true, tone: "red" }
    ]
  },
  {
    title: "Система",
    items: [
      { icon: Bell, title: "Новый бейдж", text: "Вы получили достижение «Мастер помощи».", time: "15 мая", unread: false, tone: "gold" }
    ]
  }
];
