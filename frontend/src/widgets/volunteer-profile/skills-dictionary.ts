export interface SkillOption {
  label: string;
  aliases?: string[];
  group: "interest" | "professional" | "probono";
}

export const skillOptions: SkillOption[] = [
  { label: "Помощь животным", group: "interest", aliases: ["животные", "приют", "собаки"] },
  { label: "Экология", group: "interest", aliases: ["эко", "парк", "субботник"] },
  { label: "Образование", group: "interest", aliases: ["дети", "школа", "наставничество"] },
  { label: "Пожилые люди", group: "interest", aliases: ["старшие", "пенсионеры"] },
  { label: "Культура и искусство", group: "interest", aliases: ["культура", "искусство", "музей"] },
  { label: "Спорт", group: "interest", aliases: ["события", "мероприятия"] },
  { label: "Программирование", group: "professional", aliases: ["прог", "код", "разработка", "frontend", "backend"] },
  { label: "Программная разработка", group: "professional", aliases: ["прог", "разработчик", "software"] },
  { label: "Управление проектами", group: "professional", aliases: ["project", "pm", "менеджмент", "планирование"] },
  { label: "Дизайн продукта", group: "professional", aliases: ["product", "продакт дизайн", "прототип"] },
  { label: "Обработка изображений", group: "professional", aliases: ["фотош", "фотошоп", "photo"] },
  { label: "Графический дизайн", group: "professional", aliases: ["фотош", "дизайн", "баннеры", "визуал"] },
  { label: "Аналитика", group: "professional", aliases: ["анал", "данные", "метрики"] },
  { label: "Аналитика данных", group: "professional", aliases: ["анал", "data", "данные"] },
  { label: "Визуализация данных", group: "professional", aliases: ["анал", "дашборды", "отчёты", "tableau", "power bi"] },
  { label: "Социальные сети", group: "professional", aliases: ["соцсети", "контент", "social"] },
  { label: "Копирайтинг", group: "professional", aliases: ["тексты", "редактура", "копирайт"] },
  { label: "Презентации", group: "professional", aliases: ["powerpoint", "keynote", "слайды"] },
  { label: "Планирование", group: "professional", aliases: ["организация", "координация"] },
  { label: "Дизайн интерфейсов", group: "probono", aliases: ["ux", "ui", "figma", "интерфейс"] },
  { label: "Прототипирование", group: "probono", aliases: ["дизайн", "макеты", "прототип"] },
  { label: "Юриспруденция", group: "probono", aliases: ["право", "юрист", "договор"] },
  { label: "Финансы", group: "probono", aliases: ["бюджет", "финансовая модель"] },
  { label: "Подбор команды", group: "probono", aliases: ["найм", "команда", "интервью"] }
];
