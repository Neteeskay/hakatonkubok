import type { FoundationDocumentItem } from "@/widgets/foundation-registration/foundation-registration-data";
import { currentFoundation } from "@/widgets/foundation/foundation-data";

export interface FoundationProfileForm {
  name: string;
  description: string;
  region: string;
  inn: string;
  ogrn: string;
  email: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  website: string;
  socials: string;
  contactName: string;
  contactRole: string;
  categories: string[];
  activityTypes: string[];
  coverFile?: File;
  coverFileName?: string;
  logoUploaded: boolean;
  logoFile?: File;
  logoFileName?: string;
  coverUploaded: boolean;
}

export const initialFoundationProfile: FoundationProfileForm = {
  name: currentFoundation.name,
  description: currentFoundation.description,
  region: currentFoundation.city,
  inn: "7701234567",
  ogrn: "1127700000000",
  email: "volunteer@sport-dobro.ru",
  phone: "+7 495 120-45-67",
  telegram: "@sportdobro",
  whatsapp: "+7 900 120-45-67",
  website: currentFoundation.website,
  socials: currentFoundation.socials,
  contactName: "Мария Иванова",
  contactRole: "Координатор волонтёрских программ",
  categories: currentFoundation.categories,
  activityTypes: currentFoundation.helpDirections,
  logoUploaded: true,
  coverUploaded: true
};

export const foundationProfileDocuments: FoundationDocumentItem[] = [
  {
    id: "registration",
    title: "Регистрация организации",
    description: "Юридический статус фонда подтверждён.",
    fileName: "registration-sport-dobro.pdf",
    status: "verified"
  },
  {
    id: "charter",
    title: "Устав / учредительный документ",
    description: "Основные направления деятельности фонда.",
    fileName: "charter-sport-dobro.pdf",
    status: "verified"
  },
  {
    id: "extract",
    title: "Выписка из реестра",
    description: "Актуальная выписка для повторной проверки.",
    fileName: "extract-may-2026.pdf",
    status: "uploaded"
  },
  {
    id: "contact",
    title: "Связь контактного лица с фондом",
    description: "Подтверждение полномочий координатора.",
    fileName: "coordinator-order.pdf",
    status: "uploaded"
  }
];
