import type { Foundation } from "@/entities/foundation/model";
import type { VolunteerTask } from "@/entities/task/model";
import type { VolunteerProfile } from "@/entities/volunteer/model";

export const categories = [
  "Дети и семьи",
  "Спорт",
  "Экология",
  "Образование",
  "Pro bono",
  "События"
];

export const tasks: VolunteerTask[] = [
  {
    id: "task-001",
    title: "Сопровождение семейного спортивного дня",
    foundation: "Фонд спорта и добрых дел",
    foundationId: "fond-001",
    city: "Москва",
    format: "onsite",
    commitment: "one-time",
    category: "sport",
    proBono: false,
    date: "24 мая, 10:00",
    deadline: "до 22 мая",
    hours: 5,
    spots: 18,
    filled: 12,
    status: "open",
    skills: ["events", "logistics"],
    impact: "120 семей получат понятную навигацию и поддержку на площадке",
    description:
      "Команда волонтёров встречает участников, помогает с регистрацией, сопровождает детские активности и поддерживает спокойный ритм события.",
    location: "Лужники, павильон городских программ",
    contact: { name: "Мария Румянцева", role: "Координатор фонда", phone: "+7 999 120-44-18" },
    requirements: ["Готовность быть на площадке 5 часов", "Умение спокойно общаться с детьми и родителями", "Короткий инструктаж утром события"],
    instructions: ["Прийти к стойке фонда за 30 минут", "Получить бейдж и маршрутную карту", "После события отметить часы в профиле"],
    timeline: [
      { time: "09:30", title: "Брифинг", description: "Распределение зон и выдача бейджей" },
      { time: "10:00", title: "Регистрация", description: "Встреча семей, помощь с маршрутами" },
      { time: "14:30", title: "Закрытие", description: "Сбор обратной связи и подтверждение часов" }
    ]
  },
  {
    id: "task-002",
    title: "Медиакит для благотворительного забега",
    foundation: "Линия жизни",
    foundationId: "fond-002",
    city: "Онлайн",
    format: "online",
    commitment: "one-time",
    category: "probono",
    proBono: true,
    date: "27 мая",
    deadline: "до 25 мая",
    hours: 3,
    spots: 4,
    filled: 2,
    status: "open",
    skills: ["media", "design"],
    impact: "Материалы помогут привлечь партнёров и участников забега",
    description:
      "Нужно собрать аккуратный набор баннеров, коротких текстов и визуальных карточек для внутренней рассылки и партнёрских каналов.",
    location: "Онлайн, рабочая группа в корпоративном мессенджере",
    contact: { name: "Елена Полякова", role: "PR-менеджер фонда", phone: "+7 916 503-20-11" },
    requirements: ["Опыт с презентациями или визуальными материалами", "Можно участвовать удалённо", "Готовность к одному раунду правок"],
    instructions: ["Получить бренд-пакет фонда", "Согласовать структуру медиакита", "Передать финальные материалы координатору"],
    timeline: [
      { time: "27 мая", title: "Старт", description: "Синхронизация по материалам" },
      { time: "28 мая", title: "Черновик", description: "Первый комплект карточек" },
      { time: "29 мая", title: "Финал", description: "Передача готового медиакита" }
    ]
  },
  {
    id: "task-003",
    title: "Наставничество по digital-профессиям",
    foundation: "Шанс",
    foundationId: "fond-003",
    city: "Санкт-Петербург",
    format: "hybrid",
    commitment: "regular",
    category: "education",
    proBono: true,
    date: "30 мая, 18:30",
    deadline: "до 28 мая",
    hours: 8,
    spots: 10,
    filled: 7,
    status: "open",
    skills: ["mentoring", "analytics"],
    impact: "20 подростков пройдут карьерные мини-сессии",
    description:
      "Серия встреч с сотрудниками, где подростки узнают о продуктовой аналитике, дизайне и клиентских сервисах через реальные кейсы.",
    location: "Пространство «Среда», Невский проспект",
    contact: { name: "Илья Орлов", role: "Программный менеджер", phone: "+7 921 440-17-09" },
    requirements: ["Опыт в digital-команде от 1 года", "Готовность провести 2 встречи", "Спокойная обратная связь подросткам"],
    instructions: ["Выбрать слот в календаре", "Подготовить 3 рабочих примера", "Заполнить короткую форму после встречи"],
    timeline: [
      { time: "30 мая", title: "Знакомство", description: "Вводная встреча и подбор групп" },
      { time: "6 июня", title: "Практика", description: "Разбор профессий и мини-кейсов" },
      { time: "13 июня", title: "Итоги", description: "Обратная связь и подтверждение часов" }
    ]
  },
  {
    id: "task-004",
    title: "Сортировка наборов для приютов",
    foundation: "Тёплый город",
    foundationId: "fond-004",
    city: "Казань",
    format: "onsite",
    commitment: "one-time",
    category: "animals",
    proBono: false,
    date: "1 июня, 12:00",
    deadline: "до 30 мая",
    hours: 4,
    spots: 16,
    filled: 9,
    status: "open",
    skills: ["logistics", "events"],
    impact: "6 приютов получат корма и хозяйственные наборы",
    description:
      "Нужно помочь собрать и промаркировать коробки, проверить списки и подготовить передачу партнёрской службе доставки.",
    location: "Склад партнёра, ул. Складская, 8",
    contact: { name: "Наталья Хасанова", role: "Координатор сборов", phone: "+7 987 118-09-20" },
    requirements: ["Можно без специальной подготовки", "Удобная одежда", "Готовность к работе на складе"],
    instructions: ["Отметиться у координатора", "Получить зону сортировки", "Проверить итоговый список коробок"],
    timeline: [
      { time: "12:00", title: "Разбор партий", description: "Распределяем наборы по адресатам" },
      { time: "14:00", title: "Маркировка", description: "Готовим накладные и этикетки" },
      { time: "16:00", title: "Передача", description: "Сдаём коробки доставке" }
    ]
  },
  {
    id: "task-005",
    title: "Аудит анкеты для подопечных фонда",
    foundation: "Добрые решения",
    foundationId: "fond-005",
    city: "Онлайн",
    format: "online",
    commitment: "long-term",
    category: "probono",
    proBono: true,
    date: "3 июня",
    deadline: "до 31 мая",
    hours: 10,
    spots: 3,
    filled: 1,
    status: "in_progress",
    skills: ["analytics", "design"],
    impact: "Фонд сократит время обработки заявок и сделает форму понятнее",
    description:
      "Команда фонда просит помочь пересобрать анкету: убрать лишние поля, улучшить структуру и подготовить рекомендации для внедрения.",
    location: "Онлайн, созвон 2 раза в неделю",
    contact: { name: "Алексей Морозов", role: "Руководитель продукта фонда", phone: "+7 903 221-80-55" },
    requirements: ["Опыт UX-исследований или аналитики", "Готовность оформить выводы", "Аккуратная работа с чувствительными данными"],
    instructions: ["Получить доступ к обезличенным материалам", "Провести аудит формы", "Передать карту улучшений"],
    timeline: [
      { time: "3 июня", title: "Kick-off", description: "Разбираем текущую анкету" },
      { time: "7 июня", title: "Гипотезы", description: "Формируем список улучшений" },
      { time: "12 июня", title: "Рекомендации", description: "Отдаём финальный документ" }
    ]
  }
];

export const volunteers: VolunteerProfile[] = [
  {
    id: "vol-001",
    name: "Анна Соколова",
    role: "Продуктовый дизайнер",
    department: "Цифровые сервисы",
    city: "Москва",
    hours: 46,
    completedTasks: 9,
    interests: ["дети", "спорт", "дизайн", "события"],
    level: "Амбассадор",
    activeTaskIds: ["task-001", "task-002"],
    achievements: ["10 задач", "Pro bono вклад", "Координатор события"],
    history: [
      { title: "Семейный спортивный день", date: "апрель", hours: 5, status: "подтверждено" },
      { title: "Медиаподдержка забега", date: "март", hours: 4, status: "подтверждено" },
      { title: "Сбор школьных наборов", date: "февраль", hours: 6, status: "подтверждено" }
    ],
    notifications: [
      { title: "Подтвердите участие", text: "Координатор ждёт ответ по спортивному дню до 22 мая." },
      { title: "Часы засчитаны", text: "4 часа за медиакит добавлены в профиль." }
    ]
  }
];

export const foundations: Foundation[] = [
  {
    id: "fond-001",
    name: "Фонд спорта и добрых дел",
    focus: "Спорт, семьи, городские события",
    city: "Москва",
    activeTasks: 6,
    volunteersNeeded: 42,
    responseRate: 92,
    moderationStatus: "approved",
    curator: "Мария Румянцева",
    reportsReady: 4
  },
  {
    id: "fond-002",
    name: "Линия жизни",
    focus: "Здоровье и поддержка детей",
    city: "Москва",
    activeTasks: 4,
    volunteersNeeded: 18,
    responseRate: 87,
    moderationStatus: "approved",
    curator: "Елена Полякова",
    reportsReady: 3
  },
  {
    id: "fond-003",
    name: "Шанс",
    focus: "Образование и наставничество",
    city: "Санкт-Петербург",
    activeTasks: 3,
    volunteersNeeded: 21,
    responseRate: 81,
    moderationStatus: "review",
    curator: "Илья Орлов",
    reportsReady: 2
  },
  {
    id: "fond-004",
    name: "Тёплый город",
    focus: "Помощь приютам и городским складам",
    city: "Казань",
    activeTasks: 2,
    volunteersNeeded: 16,
    responseRate: 78,
    moderationStatus: "changes",
    curator: "Наталья Хасанова",
    reportsReady: 1
  }
];

export const impactSeries = [
  { month: "Янв", hours: 320, tasks: 24 },
  { month: "Фев", hours: 410, tasks: 32 },
  { month: "Мар", hours: 520, tasks: 39 },
  { month: "Апр", hours: 680, tasks: 48 },
  { month: "Май", hours: 740, tasks: 56 }
];

export const applications = [
  { id: "app-001", volunteer: "Анна Соколова", task: "Сопровождение спортивного дня", status: "новая", hours: 5 },
  { id: "app-002", volunteer: "Павел Ильин", task: "Медиакит для забега", status: "на согласовании", hours: 3 },
  { id: "app-003", volunteer: "Дарья Никифорова", task: "Наставничество", status: "принята", hours: 8 }
];

export const moderationQueue = [
  { id: "mod-001", title: "Новая задача от фонда «Шанс»", type: "Задача", status: "проверка", owner: "Илья Орлов" },
  { id: "mod-002", title: "Изменения профиля «Тёплый город»", type: "Фонд", status: "нужны правки", owner: "Наталья Хасанова" },
  { id: "mod-003", title: "Подтверждение 24 волонтёрских часов", type: "Часы", status: "проверка", owner: "Мария Румянцева" }
];
