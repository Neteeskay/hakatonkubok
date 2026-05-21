import { AlertCircle, CheckCircle2, Clock3, FileCheck2, FileWarning, type LucideIcon } from "lucide-react";

export type FoundationDocumentStatus = "empty" | "uploading" | "uploaded" | "error" | "replace" | "verified";
export type FoundationRegistrationStep = "main" | "contacts" | "documents" | "review";
export type PreferredContact = "Telegram" | "WhatsApp" | "Email" | "Телефон";

export interface FoundationRegistrationForm {
  name: string;
  description: string;
  categories: string[];
  inn: string;
  ogrn: string;
  region: string;
  website: string;
  accountEmail: string;
  password: string;
  passwordConfirm: string;
  socials: string;
  activityTypes: string[];
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  preferredContact: PreferredContact;
  logoUploaded: boolean;
  coverUploaded: boolean;
}

export interface FoundationDocumentItem {
  id: string;
  title: string;
  description: string;
  file?: File;
  fileName?: string;
  status: FoundationDocumentStatus;
}

export const foundationSteps: { id: FoundationRegistrationStep; title: string; text: string }[] = [
  { id: "main", title: "Основное", text: "Профиль и направления помощи" },
  { id: "contacts", title: "Контакты", text: "Координатор и способ связи" },
  { id: "documents", title: "Документы", text: "Файлы для проверки" },
  { id: "review", title: "Проверка", text: "Отправка заявки" }
];

export const foundationCategoryOptions = ["Спорт", "Помощь детям", "Экология", "IT", "Дизайн", "Образование", "Адресная помощь", "Pro bono"];
export const foundationActivityOptions = ["События", "Логистика", "Наставничество", "Pro bono задачи", "Контент", "Коммуникации", "Образовательные встречи", "Адресная помощь"];
export const preferredContactOptions: PreferredContact[] = ["Telegram", "WhatsApp", "Email", "Телефон"];

export const initialFoundationForm: FoundationRegistrationForm = {
  name: "",
  description: "",
  categories: ["Спорт"],
  inn: "",
  ogrn: "",
  region: "Москва",
  website: "",
  accountEmail: "",
  password: "",
  passwordConfirm: "",
  socials: "",
  activityTypes: ["События"],
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  telegram: "",
  whatsapp: "",
  preferredContact: "Telegram",
  logoUploaded: false,
  coverUploaded: false
};

export const initialFoundationDocuments: FoundationDocumentItem[] = [
  {
    id: "registration",
    title: "Регистрация организации",
    description: "Документ, подтверждающий юридический статус.",
    status: "empty"
  },
  {
    id: "charter",
    title: "Устав / учредительный документ",
    description: "Помогает проверить направление деятельности.",
    status: "empty"
  },
  {
    id: "extract",
    title: "Выписка из реестра",
    description: "Если есть актуальная выписка, приложите её к заявке.",
    status: "empty"
  },
  {
    id: "diligence",
    title: "Материалы проверки",
    description: "Дополнительные файлы, отчёты или презентация фонда.",
    status: "empty"
  },
  {
    id: "contact",
    title: "Связь контактного лица с фондом",
    description: "Письмо, доверенность или приказ о назначении.",
    status: "empty"
  }
];

export const documentStatusConfig: Record<FoundationDocumentStatus, { label: string; helper: string; icon: LucideIcon; className: string }> = {
  empty: {
    label: "Не загружено",
    helper: "Можно добавить позже",
    icon: FileWarning,
    className: "bg-[#f4f3ee] text-black/52"
  },
  uploading: {
    label: "Загружается",
    helper: "Файл обрабатывается",
    icon: Clock3,
    className: "bg-brand/16 text-black"
  },
  uploaded: {
    label: "Загружено",
    helper: "Файл прикреплён",
    icon: FileCheck2,
    className: "bg-[#f7f9ff] text-[#315ed1]"
  },
  error: {
    label: "Ошибка",
    helper: "Попробуйте заменить файл",
    icon: AlertCircle,
    className: "bg-[#fff1f1] text-[#c83c3c]"
  },
  replace: {
    label: "Требуется замена",
    helper: "Нужен другой файл",
    icon: FileWarning,
    className: "bg-[#fff1f1] text-[#c83c3c]"
  },
  verified: {
    label: "Подтверждено",
    helper: "Документ принят",
    icon: CheckCircle2,
    className: "bg-[#e8f8eb] text-[#247a31]"
  }
};
