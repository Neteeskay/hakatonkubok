import { z } from "zod";
import type { FoundationRegistrationForm, FoundationRegistrationStep } from "@/widgets/foundation-registration/foundation-registration-data";

export function isOptionalUrlValid(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname.includes(".") && !url.hostname.includes(" "));
  } catch {
    return false;
  }
}

export const foundationRegistrationSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  categories: z.array(z.string()).min(1),
  inn: z.string().regex(/^\d{10}(\d{2})?$/),
  ogrn: z.string().regex(/^\d{13,15}$/).or(z.literal("")),
  region: z.string().min(2),
  website: z.string().refine(isOptionalUrlValid),
  accountEmail: z.string().email(),
  password: z.string().min(6),
  passwordConfirm: z.string().min(6),
  socials: z.string(),
  activityTypes: z.array(z.string()).min(1),
  contactName: z.string().min(2),
  contactRole: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  telegram: z.string(),
  whatsapp: z.string(),
  preferredContact: z.enum(["Telegram", "WhatsApp", "Email", "Телефон"]),
  logoUploaded: z.boolean(),
  coverUploaded: z.boolean()
});

export function validateFoundationStep(step: FoundationRegistrationStep, form: FoundationRegistrationForm) {
  if (step === "main") {
    return Boolean(
      form.name.trim().length > 1 &&
      form.categories.length &&
      /^\d{10}(\d{2})?$/.test(form.inn) &&
      form.region.trim().length > 1 &&
      form.activityTypes.length &&
      isOptionalUrlValid(form.website) &&
      /\S+@\S+\.\S+/.test(form.accountEmail) &&
      form.password.length >= 6 &&
      form.password === form.passwordConfirm
    );
  }

  if (step === "contacts") {
    return Boolean(form.contactName.length > 1 && form.contactRole.length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 10);
  }

  return true;
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const parts = [
    normalized.slice(0, 1),
    normalized.slice(1, 4),
    normalized.slice(4, 7),
    normalized.slice(7, 9),
    normalized.slice(9, 11)
  ];
  return `+${parts[0]}${parts[1] ? ` ${parts[1]}` : ""}${parts[2] ? ` ${parts[2]}` : ""}${parts[3] ? `-${parts[3]}` : ""}${parts[4] ? `-${parts[4]}` : ""}`;
}
