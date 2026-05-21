import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  History,
  Inbox,
  ListChecks,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
  XCircle,
  type LucideIcon
} from "lucide-react";

export type AdminTone = "wait" | "review" | "success" | "danger" | "revision" | "done" | "brand";
export type AdminFoundationStatus = "pending" | "approved" | "revision" | "rejected" | "active";
export type AdminTaskStatus = "draft" | "moderation" | "published" | "inWork" | "returned" | "rejected" | "completed";
export type AdminApplicationStatus = "submitted" | "review" | "accepted" | "rejected" | "done" | "waitingHours" | "hoursAdded";

export interface AdminFoundation {
  id: string;
  name: string;
  description: string;
  logo: string;
  region: string;
  categories: string[];
  inn: string;
  ogrn: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  socials: string;
  telegram?: string;
  whatsapp?: string;
  legalAddress?: string;
  cover?: string;
  plannedActivities: string[];
  documents: { fileName: string; fileUrl?: string; status: "uploaded" | "verified" | "replace"; title: string }[];
  status: AdminFoundationStatus;
  registeredAt: string;
  adminComment?: string;
  activeTasks: number;
  volunteers: number;
  hours: number;
}

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  image: string;
  goal: string;
  volunteerActions: string[];
  foundationId: string;
  foundation: string;
  category: string;
  format: "Онлайн" | "Офлайн" | "Гибрид";
  city: string;
  deadline: string;
  period: string;
  spots: number;
  filled: number;
  hours: number;
  proBono: boolean;
  requirements: string[];
  materials: string[];
  instruction: string;
  location: string;
  communication: string;
  contacts: string;
  status: AdminTaskStatus;
  moderatorComment?: string;
}

export interface AdminHourCase {
  id: string;
  taskId: string;
  taskTitle: string;
  foundation: string;
  volunteer: string;
  volunteerAvatar: string;
  city: string;
  confirmedByFoundation: string;
  requestedHours: number;
  approvedHours: number;
  status: "ready" | "needsCheck" | "approved" | "rejected";
  note: string;
}

export interface AdminVolunteer {
  id: string;
  name: string;
  avatar: string;
  city: string;
  role: string;
  skills: string[];
  interests: string[];
  proSkills: string[];
  badges: string[];
  categories: { label: string; value: number }[];
  hours: number;
  activities: number;
  status: "active" | "new" | "pause";
  history: string[];
}

export interface AdminNotification {
  id: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  tone: AdminTone;
  target: string;
}

export const adminToneStyles: Record<AdminTone, { badge: string; surface: string; icon: string; text: string }> = {
  wait: { badge: "bg-[#f4f3ee] text-black/62", surface: "bg-[#fbfaf4]", icon: "bg-[#f1efe7] text-black/62", text: "text-black/62" },
  review: { badge: "bg-[#e9efff] text-[#315ed1]", surface: "bg-[#f7f9ff]", icon: "bg-[#e9efff] text-[#315ed1]", text: "text-[#315ed1]" },
  success: { badge: "bg-[#e6f8e9] text-[#247a31]", surface: "bg-[#f0fbf1]", icon: "bg-[#e1f7e5] text-[#247a31]", text: "text-[#247a31]" },
  danger: { badge: "bg-[#ffe8e8] text-[#c83c3c]", surface: "bg-[#fff6f6]", icon: "bg-[#ffe8e8] text-[#c83c3c]", text: "text-[#c83c3c]" },
  revision: { badge: "bg-[#fff0d8] text-[#9b5a00]", surface: "bg-[#fff9ee]", icon: "bg-[#fff0d8] text-[#9b5a00]", text: "text-[#9b5a00]" },
  done: { badge: "bg-[#eee9ff] text-[#6b4de6]", surface: "bg-[#f7f4ff]", icon: "bg-[#eee9ff] text-[#6b4de6]", text: "text-[#6b4de6]" },
  brand: { badge: "bg-brand/22 text-black", surface: "bg-brand/12", icon: "bg-brand text-black", text: "text-black" }
};

export const foundationStatusConfig: Record<AdminFoundationStatus, { label: string; tone: AdminTone; icon: LucideIcon; helper: string }> = {
  pending: { label: "На проверке", tone: "brand", icon: Clock3, helper: "Ожидает решения администратора" },
  approved: { label: "Одобрен", tone: "success", icon: CheckCircle2, helper: "Может публиковать задания" },
  revision: { label: "На доработке", tone: "revision", icon: RotateCcw, helper: "Фонд видит комментарий" },
  rejected: { label: "Отклонён", tone: "danger", icon: XCircle, helper: "Публикация недоступна" },
  active: { label: "Активен", tone: "success", icon: ShieldCheck, helper: "Работает на платформе" }
};

export const taskStatusConfig: Record<AdminTaskStatus, { label: string; tone: AdminTone; icon: LucideIcon; helper: string }> = {
  draft: { label: "Черновик", tone: "wait", icon: FileText, helper: "Не отправлен" },
  moderation: { label: "На модерации", tone: "review", icon: Clock3, helper: "Нужно проверить" },
  published: { label: "Опубликовано", tone: "success", icon: CheckCircle2, helper: "Видно волонтёрам" },
  inWork: { label: "В работе", tone: "brand", icon: TrendingUp, helper: "Набор или выполнение" },
  returned: { label: "На доработке", tone: "revision", icon: RotateCcw, helper: "Есть комментарий" },
  rejected: { label: "Отклонено", tone: "danger", icon: XCircle, helper: "Не опубликовано" },
  completed: { label: "Завершено", tone: "done", icon: Flag, helper: "Ожидает закрытия часов" }
};

export const applicationStatusConfig: Record<AdminApplicationStatus, { label: string; tone: AdminTone; icon: LucideIcon }> = {
  submitted: { label: "Подан", tone: "wait", icon: Inbox },
  review: { label: "На рассмотрении", tone: "review", icon: Clock3 },
  accepted: { label: "Принят", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Отклонён", tone: "danger", icon: XCircle },
  done: { label: "Выполнено", tone: "done", icon: Flag },
  waitingHours: { label: "Ожидает часов", tone: "revision", icon: History },
  hoursAdded: { label: "Часы начислены", tone: "success", icon: Star }
};

export const adminFoundations: AdminFoundation[] = [
  {
    id: "fond-001",
    name: "Фонд спорта и добрых дел",
    description: "Проводит семейные спортивные события, образовательные программы и городские активности для детей и родителей.",
    logo: "/logo.png",
    region: "Москва",
    categories: ["Спорт", "Дети", "События"],
    inn: "7701234567",
    ogrn: "1127700000000",
    contactName: "Мария Иванова",
    contactRole: "Координатор программ",
    email: "volunteer@sport-dobro.ru",
    phone: "+7 495 120-45-67",
    website: "sport-dobro.ru",
    socials: "@sportdobro",
    telegram: "@sportdobro",
    whatsapp: "+7 495 120-45-67",
    legalAddress: "Москва, ул. Добрых дел, 12",
    cover: "/backTaskVolounteer.png",
    plannedActivities: ["События", "Логистика", "Наставничество"],
    documents: [
      { title: "Регистрация организации", status: "verified", fileName: "registration.pdf" },
      { title: "Устав", status: "verified", fileName: "charter.pdf" }
    ],
    status: "active",
    registeredAt: "12 мая 2026",
    activeTasks: 6,
    volunteers: 42,
    hours: 184
  },
  {
    id: "fond-002",
    name: "Лапа добра",
    description: "Помогает приютам, организует волонтёрские выезды и сбор неденежной помощи для животных.",
    logo: "/tasks/1.jpg",
    region: "Москва",
    categories: ["Животные", "Логистика"],
    inn: "7712345678",
    ogrn: "1137700000001",
    contactName: "Елена Орлова",
    contactRole: "Руководитель волонтёрского направления",
    email: "help@lapadobra.ru",
    phone: "+7 916 200-10-30",
    website: "lapadobra.ru",
    socials: "@lapadobra",
    telegram: "@lapadobra",
    whatsapp: "+7 916 200-10-30",
    legalAddress: "Москва, ул. Приютская, 8",
    cover: "/tasks/1.jpg",
    plannedActivities: ["Выезды", "Фасовка", "Фото и контент"],
    documents: [
      { title: "Регистрация организации", status: "uploaded", fileName: "reg-lapa.pdf" },
      { title: "Устав", status: "uploaded", fileName: "charter-lapa.pdf" },
      { title: "Связь контактного лица", status: "uploaded", fileName: "contact-order.pdf" }
    ],
    status: "pending",
    registeredAt: "20 мая 2026",
    activeTasks: 1,
    volunteers: 18,
    hours: 64
  },
  {
    id: "fond-003",
    name: "Добрые руки",
    description: "Команда социальных проектов для семей, пожилых людей и образовательных инициатив.",
    logo: "/heart.png",
    region: "Санкт-Петербург",
    categories: ["Пожилые", "Образование", "Pro bono"],
    inn: "7812345678",
    ogrn: "1147800000002",
    contactName: "Антон Сергеев",
    contactRole: "Операционный директор",
    email: "team@dobrye-ruki.ru",
    phone: "+7 812 300-44-11",
    website: "dobrye-ruki.ru",
    socials: "@dobrye_ruki",
    telegram: "@dobrye_ruki",
    whatsapp: "+7 812 300-44-11",
    legalAddress: "Санкт-Петербург, Невский проспект, 44",
    cover: "/heart.png",
    plannedActivities: ["Pro bono", "Образование", "Сопровождение"],
    documents: [
      { title: "Регистрация организации", status: "replace", fileName: "scan-old.pdf" },
      { title: "Устав", status: "uploaded", fileName: "charter.pdf" }
    ],
    status: "revision",
    registeredAt: "18 мая 2026",
    adminComment: "Замените скан регистрации и добавьте документ контактного лица.",
    activeTasks: 3,
    volunteers: 25,
    hours: 128
  }
];

export const adminTasks: AdminTask[] = [
  {
    id: "task-001",
    title: "Сопровождение семейного спортивного дня",
    description: "Волонтёры встречают семьи, помогают с регистрацией, навигацией и детскими активностями.",
    image: "/tasks/3.jpg",
    goal: "Помочь семьям быстро ориентироваться на площадке и сделать событие спокойным для детей и родителей.",
    volunteerActions: ["Встречать участников", "Помогать на регистрации", "Сопровождать семьи между зонами", "Передавать вопросы координатору"],
    foundationId: "fond-001",
    foundation: "Фонд спорта и добрых дел",
    category: "События",
    format: "Офлайн",
    city: "Москва",
    deadline: "до 22 мая",
    period: "24 мая, 10:00 - 14:00",
    spots: 18,
    filled: 12,
    hours: 5,
    proBono: false,
    requirements: ["Коммуникабельность", "Пунктуальность", "Опыт событий"],
    materials: ["Бриф координатора", "Схема площадки"],
    instruction: "Координатор отправит чек-лист и схему площадки за день до события.",
    location: "Москва, семейный спортивный кластер",
    communication: "Telegram-чат команды и телефон координатора после принятия заявки",
    contacts: "Telegram-чат после принятия заявки",
    status: "moderation"
  },
  {
    id: "task-002",
    title: "Создание презентации для фонда",
    description: "Нужно оформить презентацию о деятельности фонда для грантового конкурса.",
    image: "/tasks/2.jpg",
    goal: "Собрать понятную визуальную историю фонда для грантовой заявки.",
    volunteerActions: ["Собрать структуру презентации", "Оформить 12-15 слайдов", "Подготовить финальный файл", "Передать рекомендации по стилю"],
    foundationId: "fond-003",
    foundation: "Добрые руки",
    category: "Pro bono",
    format: "Онлайн",
    city: "Онлайн",
    deadline: "до 31 мая",
    period: "27-31 мая",
    spots: 4,
    filled: 2,
    hours: 6,
    proBono: true,
    requirements: ["PowerPoint", "Storytelling", "Визуальная структура"],
    materials: ["Черновик текста", "Фото фонда"],
    instruction: "Фонд передаст текст, фото и примеры презентаций после принятия отклика.",
    location: "Онлайн, рабочий чат фонда",
    communication: "Email координатора и Telegram",
    contacts: "Email координатора и Telegram",
    status: "returned",
    moderatorComment: "Уточните итоговый формат файла и контакт для передачи материалов."
  },
  {
    id: "task-003",
    title: "Фасовка продуктовых наборов",
    description: "Помощь в сортировке и подготовке наборов для семей.",
    image: "/tasks/4.jpg",
    goal: "Быстро собрать продуктовые наборы для семей, которым нужна адресная помощь.",
    volunteerActions: ["Сортировать продукты", "Собирать наборы по списку", "Маркировать коробки", "Помогать координатору на складе"],
    foundationId: "fond-003",
    foundation: "Добрые руки",
    category: "Адресная помощь",
    format: "Офлайн",
    city: "Санкт-Петербург",
    deadline: "до 28 мая",
    period: "31 мая, 11:00 - 15:00",
    spots: 12,
    filled: 10,
    hours: 4,
    proBono: false,
    requirements: ["Готовность к физической работе", "Аккуратность"],
    materials: ["Инструкция фасовки"],
    instruction: "На месте будет короткий инструктаж и распределение по зонам.",
    location: "Санкт-Петербург, склад фонда",
    communication: "Телефон координатора после принятия",
    contacts: "Телефон координатора после принятия",
    status: "published"
  },
  {
    id: "task-004",
    title: "Онлайн-уроки для школьников",
    description: "Помощь школьникам по математике и английскому в онлайн-формате.",
    image: "/tasks/2.jpg",
    goal: "Дать школьникам регулярную поддержку по предметам и помочь закрыть пробелы.",
    volunteerActions: ["Проводить онлайн-занятия", "Готовить простые задания", "Отмечать прогресс", "Передавать обратную связь координатору"],
    foundationId: "fond-003",
    foundation: "Добрые руки",
    category: "Образование",
    format: "Онлайн",
    city: "Онлайн",
    deadline: "завершено",
    period: "10 мая - 8 июня",
    spots: 8,
    filled: 8,
    hours: 2,
    proBono: true,
    requirements: ["Предметная экспертиза", "Опыт объяснения"],
    materials: ["Программа занятий", "Список тем"],
    instruction: "Перед стартом фонд проведёт короткий звонок и выдаст учебные материалы.",
    location: "Онлайн, платформа видеосвязи",
    communication: "Внутренний чат платформы",
    contacts: "Внутренний чат платформы",
    status: "completed"
  }
];

export const adminHourCases: AdminHourCase[] = [
  {
    id: "hours-001",
    taskId: "task-004",
    taskTitle: "Онлайн-уроки для школьников",
    foundation: "Добрые руки",
    volunteer: "Анна Соколова",
    volunteerAvatar: "/avatars/avatar-anna.png",
    city: "Москва",
    confirmedByFoundation: "8 июня 2026",
    requestedHours: 2,
    approvedHours: 2,
    status: "ready",
    note: "Фонд подтвердил участие и выполнение занятия."
  },
  {
    id: "hours-002",
    taskId: "task-003",
    taskTitle: "Фасовка продуктовых наборов",
    foundation: "Добрые руки",
    volunteer: "Павел Ким",
    volunteerAvatar: "/avatars/avatar-pavel.png",
    city: "Казань",
    confirmedByFoundation: "31 мая 2026",
    requestedHours: 4,
    approvedHours: 4,
    status: "needsCheck",
    note: "Нужно сверить длительность смены с комментарием координатора."
  }
];

export const adminVolunteers: AdminVolunteer[] = [
  { id: "vol-001", name: "Анна Соколова", avatar: "/avatars/avatar-anna.png", city: "Москва", role: "Продуктовый дизайнер", skills: ["Figma", "Презентации", "UX/UI"], interests: ["Помощь детям", "Образование", "Pro bono"], proSkills: ["Product Design", "Figma", "Storytelling"], badges: ["Первые шаги", "Командный игрок", "Мастер помощи"], categories: [{ label: "Образование", value: 38 }, { label: "Pro bono", value: 32 }, { label: "Животные", value: 18 }], hours: 56, activities: 12, status: "active", history: ["Презентация для фонда", "Онлайн-уроки"] },
  { id: "vol-002", name: "Илья Мельников", avatar: "/avatars/avatar-ilya.png", city: "Москва", role: "Event-координатор", skills: ["Логистика", "События"], interests: ["Спорт", "События", "Дети"], proSkills: ["Event management", "Навигация", "Коммуникации"], badges: ["Надёжный волонтёр", "Офлайн-герой"], categories: [{ label: "События", value: 46 }, { label: "Спорт", value: 24 }, { label: "Дети", value: 18 }], hours: 34, activities: 7, status: "active", history: ["Семейный спортивный день"] },
  { id: "vol-003", name: "Мария Титова", avatar: "/avatars/avatar-maria.png", city: "Онлайн", role: "Аналитик", skills: ["BI", "Data Analysis"], interests: ["Экология", "Образование", "Pro bono"], proSkills: ["BI", "Data Analysis", "Research"], badges: ["PRO Bono Expert", "10 часов помощи", "Онлайн-волонтёр"], categories: [{ label: "Pro bono", value: 52 }, { label: "Экология", value: 18 }, { label: "Образование", value: 12 }], hours: 82, activities: 18, status: "active", history: ["Аудит анкеты", "Отчётность фонда"] }
];

export const adminNotifications: AdminNotification[] = [
  { id: "n-001", title: "Новый фонд на проверке", text: "Лапа добра загрузила документы и ожидает решения.", time: "5 мин назад", unread: true, tone: "review", target: "/admin/moderation/foundations" },
  { id: "n-002", title: "Задание на модерации", text: "Семейный спортивный день готов к проверке.", time: "18 мин назад", unread: true, tone: "brand", target: "/admin/moderation/tasks" },
  { id: "n-003", title: "Фонд подтвердил участие", text: "Онлайн-уроки для школьников ожидают начисления часов.", time: "1 час назад", unread: true, tone: "revision", target: "/admin/hours" },
  { id: "n-004", title: "Исправления отправлены", text: "Добрые руки обновили документы фонда.", time: "вчера", unread: false, tone: "success", target: "/admin/moderation/foundations" }
];

export const adminKpis = [
  { label: "Фонды на модерации", value: "2", helper: "1 требует документов", icon: Building2, tone: "review" },
  { label: "Задания на модерации", value: "3", helper: "средний SLA 3,4 ч", icon: ShieldCheck, tone: "brand" },
  { label: "Опубликованные задания", value: "48", helper: "12 активных сегодня", icon: ListChecks, tone: "success" },
  { label: "Завершённые задания", value: "18", helper: "7 ждут часов", icon: CheckCircle2, tone: "done" },
  { label: "Волонтёры", value: "10 000+", helper: "342 активны за месяц", icon: UsersRound, tone: "review" },
  { label: "Подтверждённые часы", value: "1 000 000+", helper: "+184 за неделю", icon: Clock3, tone: "success" },
  { label: "Активные отклики", value: "127", helper: "24 требуют решения", icon: MessageCircle, tone: "revision" }
] satisfies { label: string; value: string; helper: string; icon: LucideIcon; tone: AdminTone }[];

export const analyticsBars = [
  { label: "Фонды", value: 82, caption: "активность" },
  { label: "Волонтёры", value: 96, caption: "рост" },
  { label: "Задания", value: 74, caption: "публикации" },
  { label: "Отклики", value: 88, caption: "конверсия" },
  { label: "Часы", value: 68, caption: "подтверждено" }
];
