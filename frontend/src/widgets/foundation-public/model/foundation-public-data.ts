import { BookOpen, Heart, Leaf, Medal, PawPrint, UsersRound } from "lucide-react";

export const foundationDetails = {
  "fond-001": {
    logo: "ФС",
    description: "Помогаем семьям, детям и городским спортивным инициативам проводить безопасные и тёплые события.",
    mission: "Делаем спорт и городские события доступнее для семей, которым важна поддержка рядом.",
    site: "sport-good.ru",
    email: "hello@sport-good.ru",
    phone: "+7 999 120-44-18",
    inn: "7704 000 128",
    verified: true,
    categories: ["спорт", "дети", "семьи", "события"],
    activityTypes: ["помощь на площадке", "регистрация участников", "навигация", "сопровождение семей"],
    icons: [Medal, Heart, UsersRound]
  },
  "fond-002": {
    logo: "ЛЖ",
    description: "Поддерживает медицинские и образовательные проекты для детей, которым нужна забота и внимание.",
    mission: "Соединяем людей и ресурсы, чтобы дети быстрее получали помощь и поддержку.",
    site: "life-line.ru",
    email: "volunteer@life-line.ru",
    phone: "+7 916 503-20-11",
    inn: "7705 100 431",
    verified: true,
    categories: ["дети", "здоровье", "pro bono", "медиа"],
    activityTypes: ["контент", "презентации", "партнёрские материалы", "сопровождение событий"],
    icons: [Heart, BookOpen, UsersRound]
  },
  "fond-003": {
    logo: "ШН",
    description: "Образовательный фонд для подростков: наставничество, карьерные встречи и digital-практика.",
    mission: "Помогаем подросткам увидеть будущую профессию через реальные истории специалистов.",
    site: "chance-edu.ru",
    email: "team@chance-edu.ru",
    phone: "+7 921 440-17-09",
    inn: "7802 330 901",
    verified: false,
    categories: ["образование", "наставничество", "подростки", "pro bono"],
    activityTypes: ["менторство", "разбор профессий", "онлайн-сессии", "практические кейсы"],
    icons: [BookOpen, UsersRound, Medal]
  },
  "fond-004": {
    logo: "ТГ",
    description: "Городская помощь приютам, складам и локальным инициативам для животных.",
    mission: "Делаем бытовую помощь приютам регулярной, понятной и посильной для каждого.",
    site: "warm-city.ru",
    email: "help@warm-city.ru",
    phone: "+7 987 118-09-20",
    inn: "1650 882 104",
    verified: true,
    categories: ["животные", "логистика", "город", "склады"],
    activityTypes: ["сортировка", "маркировка", "передача наборов", "помощь приютам"],
    icons: [PawPrint, Leaf, Heart]
  },
  "fond-005": {
    logo: "ДР",
    description: "Pro bono фонд, который улучшает сервисы поддержки и внутренние процессы НКО.",
    mission: "Помогаем фондам становиться понятнее для подопечных и быстрее обрабатывать заявки.",
    site: "good-solutions.ru",
    email: "product@good-solutions.ru",
    phone: "+7 903 221-80-55",
    inn: "7709 442 818",
    verified: true,
    categories: ["pro bono", "аналитика", "дизайн", "сервисы"],
    activityTypes: ["аудит анкет", "UX-рекомендации", "исследования", "продуктовая помощь"],
    icons: [BookOpen, Medal, Heart]
  }
};

export function getFoundationDetails(id: string) {
  return foundationDetails[id as keyof typeof foundationDetails] ?? foundationDetails["fond-001"];
}
