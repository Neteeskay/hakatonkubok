"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, ImagePlus, Link2, LockKeyhole, Mail, MessageCircle, Phone, Send, Smartphone, X, type LucideIcon } from "lucide-react";
import { getApiErrorMessage, type HelpCategoryResponse } from "@/shared/api";
import { resolveApiFileUrl } from "@/shared/api/config";
import type { TaskDictionaryOptionResponse } from "@/shared/api/types";
import { russianCities } from "@/shared/config/russian-cities";
import { cn } from "@/shared/lib/utils";
import { SkillsInput } from "@/widgets/volunteer-profile/ui/skills-input";
import type { SkillOption } from "@/widgets/volunteer-profile/skills-dictionary";
import { fallbackCategoryOptions } from "@/widgets/volunteer-feed/task-dictionaries";
import type { FoundationContactVisibility, FoundationTaskItem } from "@/widgets/foundation/foundation-data";

const forbiddenWords = ["деньги", "сбор средств", "пожертвования", "донат", "перевод", "fundraising", "собрать сумму"];
const fallbackFormats = ["Онлайн", "Офлайн"];
const fallbackPeriodicity = ["Разовые", "Регулярные", "Долгосрочные"];
const fallbackTaskTypes = [
  { label: "Обычные задания", value: "regular" },
  { label: "Pro Bono", value: "pro_bono" }
] satisfies TaskDictionaryOptionResponse[];

export interface FoundationTaskFormValues {
  capacity: string;
  category: string;
  chatLink: string;
  city: string;
  contactNote: string;
  contactVisibility: FoundationContactVisibility;
  deadline: string;
  description: string;
  email: string;
  format: "Онлайн" | "Офлайн";
  hours: string;
  imageFile?: File | null;
  instructions: string;
  location: string;
  periodicity: string;
  phone: string;
  requirements: string[];
  skills: string[];
  taskType: "regular" | "pro_bono";
  telegram: string;
  title: string;
  whatsapp: string;
}

export function CreateTaskForm({
  canPublish = true,
  moderationComment,
  initialTask,
  categoryOptions,
  durationOptions,
  formatOptions,
  skillOptions,
  taskTypeOptions,
  submitLabel = "Отправить на модерацию",
  onSubmit
}: {
  canPublish?: boolean;
  moderationComment?: string;
  initialTask?: FoundationTaskItem;
  categoryOptions?: HelpCategoryResponse[];
  durationOptions?: TaskDictionaryOptionResponse[];
  formatOptions?: TaskDictionaryOptionResponse[];
  skillOptions?: SkillOption[];
  taskTypeOptions?: TaskDictionaryOptionResponse[];
  submitLabel?: string;
  onSubmit?: (values: FoundationTaskFormValues) => Promise<void> | void;
}) {
  const categories = categoryOptions?.length ? categoryOptions : fallbackCategoryOptions;
  const formats = formatOptions?.length ? formatOptions.map((item) => item.label) : fallbackFormats;
  const periodicity = durationOptions?.length ? durationOptions.map((item) => item.label) : fallbackPeriodicity;
  const taskTypes = taskTypeOptions?.length ? taskTypeOptions : fallbackTaskTypes;
  const initialCategory = categories.find((item) => item.label === initialTask?.category || item.value === initialTask?.category)?.value ?? categories[0]?.value ?? "events";
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [instructions, setInstructions] = useState(initialTask?.instructions ?? "");
  const [requirements, setRequirements] = useState<string[]>(initialTask?.requirements ?? []);
  const [skills, setSkills] = useState<string[]>(initialTask?.skills ?? []);
  const [format, setFormat] = useState(initialTask?.format === "Гибрид" ? "Офлайн" : initialTask?.format ?? "Офлайн");
  const [category, setCategory] = useState<string>(initialCategory);
  const [city, setCity] = useState(initialTask?.city === "Онлайн" ? "Онлайн" : initialTask?.city ?? "Москва");
  const [period, setPeriod] = useState(initialTask?.period?.includes("Регуляр") ? "Регулярные" : initialTask?.period?.includes("Долг") ? "Долгосрочные" : "Разовые");
  const [taskType, setTaskType] = useState<"regular" | "pro_bono">(initialTask?.taskType ?? "regular");
  const [location, setLocation] = useState(initialTask?.location ?? "");
  const [deadline, setDeadline] = useState(initialTask?.deadline ?? "");
  const [capacity, setCapacity] = useState(initialTask ? String(initialTask.capacity) : "");
  const [hours, setHours] = useState(initialTask ? String(initialTask.hours) : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(() => resolveApiFileUrl(initialTask?.imageUrl));
  const [contactVisibility, setContactVisibility] = useState<FoundationContactVisibility>(initialTask?.contactVisibility ?? "after_acceptance");
  const [telegram, setTelegram] = useState(initialTask?.contacts?.telegram ?? "");
  const [whatsapp, setWhatsapp] = useState(initialTask?.contacts?.whatsapp ?? "");
  const [email, setEmail] = useState(initialTask?.contacts?.email ?? "");
  const [phone, setPhone] = useState(initialTask?.contacts?.phone ?? "");
  const [chatLink, setChatLink] = useState(initialTask?.contacts?.chatLink ?? "");
  const [contactNote, setContactNote] = useState(initialTask?.contacts?.instruction ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const text = `${title} ${description} ${instructions} ${contactNote}`.toLowerCase();
  const fundraisingDetected = useMemo(() => forbiddenWords.some((word) => text.includes(word)), [text]);
  const validationMessages = useMemo(() => validateTaskForm({
    capacity,
    category,
    chatLink,
    city,
    contactNote,
    contactVisibility,
    deadline,
    description,
    email,
    format: format as "Онлайн" | "Офлайн",
    hours,
    instructions,
    location,
    periodicity: period,
    phone,
    requirements,
    skills,
    taskType,
    telegram,
    title,
    whatsapp
  }, fundraisingDetected), [
    capacity,
    category,
    chatLink,
    city,
    contactNote,
    contactVisibility,
    deadline,
    description,
    email,
    format,
    fundraisingDetected,
    hours,
    imageFile,
    instructions,
    location,
    period,
    phone,
    requirements,
    skills,
    taskType,
    telegram,
    title,
    whatsapp
  ]);
  const canSubmit = canPublish && validationMessages.length === 0 && !submitting;

  async function submitTask() {
    if (!canSubmit) {
      setSubmitError(validationMessages[0] ?? "Проверьте поля формы перед отправкой.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit?.({
        capacity,
        category,
        chatLink,
        city,
        contactVisibility,
        contactNote,
        deadline,
        description,
        email,
        format: format as "Онлайн" | "Офлайн",
        hours,
        imageFile,
        instructions,
        location,
        periodicity: period,
        phone,
        requirements,
        skills,
        taskType,
        telegram,
        title,
        whatsapp
      });
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(toTaskSubmitMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canPublish) {
    return <FoundationLockedState moderationComment={moderationComment} />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.65rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название задания" placeholder="Помощь на спортивном семейном фестивале" value={title} onChange={setTitle} />
          <SelectField label="Категория помощи" value={category} onChange={setCategory} options={categories.map((item) => ({ label: item.label, value: item.value }))} />
          <SelectField label="Тип задания" value={taskType} onChange={(value) => setTaskType(value as "regular" | "pro_bono")} options={taskTypes.map((item) => ({ label: item.label, value: item.value }))} />
          <TextField label="Описание" placeholder="Кратко опишите, что нужно сделать волонтёру" value={description} onChange={setDescription} className="md:col-span-2" />
          <SelectField label="Формат участия" value={format} onChange={(value) => setFormat(value as "Онлайн" | "Офлайн")} options={formats.map((item) => ({ label: item, value: item }))} />
          <CityField label="Город" value={city} onChange={setCity} disabled={format === "Онлайн"} />
          <Field label="Адрес или ссылка" placeholder={format === "Онлайн" ? "Ссылка появится после принятия" : "Москва, парк Сокольники"} value={location} onChange={setLocation} />
          <Field label="Дедлайн отклика" placeholder="25 мая 2026" value={deadline} onChange={setDeadline} />
          <SelectField label="Периодичность" value={period} onChange={setPeriod} options={periodicity.map((item) => ({ label: item, value: item }))} />
          <Field label="Количество участников" placeholder="12" value={capacity} onChange={(value) => setCapacity(value.replace(/\D/g, ""))} />
          <Field label="Волонтёрские часы" placeholder="4" value={hours} onChange={(value) => setHours(value.replace(/[^\d.,]/g, ""))} />
        </div>
      </section>

      <section className="rounded-[1.65rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] md:p-6">
        <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
          <div className="relative h-36 overflow-hidden rounded-[1.2rem] bg-[#f5f2ea] shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]">
            {imagePreview ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${imagePreview}')` }} />
            ) : (
              <div className="grid h-full place-items-center text-black/36">
                <ImagePlus className="size-10" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black">Картинка задания</h2>
            <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-black/52">Обложка будет храниться на платформе и показываться в карточках задания у фонда, администратора и волонтёров.</p>
            <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.1)] transition hover:bg-brand/12">
              <ImagePlus className="size-4" />
              {imageFile || imagePreview ? "Заменить картинку" : "Загрузить картинку"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : resolveApiFileUrl(initialTask?.imageUrl));
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <SkillsInput label="Требования" description="Что важно для участия: опыт, личные качества, возрастные ограничения." value={requirements} onChange={setRequirements} groups={["interest", "professional"]} options={skillOptions} />
        <SkillsInput label="Навыки" description="Профессиональные навыки, если задание pro bono или требует компетенций." value={skills} onChange={setSkills} groups={["professional", "probono"]} options={skillOptions} tone="violet" />
      </section>

      <section className="rounded-[1.65rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Контакты для связи</h2>
            <p className="mt-1 max-w-2xl text-sm font-bold leading-6 text-black/48">Фонд сам выбирает, когда волонтёр увидит организационную информацию.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <ContactVisibilityCard
            icon={LockKeyhole}
            title="После подтверждения участия"
            text="До назначения волонтёр видит аккуратное сообщение, а контакты открываются после принятия заявки."
            active={contactVisibility === "after_acceptance"}
            onClick={() => setContactVisibility("after_acceptance")}
          />
          <ContactVisibilityCard
            icon={Eye}
            title="Показывать сразу"
            text="Контакты и инструкция доступны сразу в карточке задания и отклике."
            active={contactVisibility === "immediate"}
            onClick={() => setContactVisibility("immediate")}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ContactField icon={Send} label="Telegram" placeholder="@fond_volunteer" value={telegram} onChange={setTelegram} />
          <ContactField icon={Smartphone} label="WhatsApp" placeholder="+7 900 000-00-00" value={whatsapp} onChange={setWhatsapp} />
          <ContactField icon={Mail} label="Email" placeholder="volunteer@fond.ru" value={email} onChange={setEmail} />
          <ContactField icon={Phone} label="Телефон" placeholder="+7 900 000-00-00" value={phone} onChange={setPhone} />
          <ContactField icon={Link2} label="Ссылка на чат" placeholder="https://t.me/..." value={chatLink} onChange={setChatLink} />
          <ContactField icon={MessageCircle} label="Инструкция" placeholder="Что сделать после принятия" value={contactNote} onChange={setContactNote} />
        </div>
      </section>

      <section className="rounded-[1.65rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_52px_rgba(34,28,8,0.045)] md:p-6">
        <TextField label="Инструкции и материалы" placeholder="Опишите, какие материалы получит волонтёр и что будет результатом участия" value={instructions} onChange={setInstructions} />
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-h-6">
            {submitError ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-black text-[#c83c3c]"><X className="size-4" />{submitError}</p>
            ) : validationMessages.length ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-black text-[#c83c3c]"><X className="size-4" />{validationMessages[0]}</p>
            ) : submitSuccess ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f8eb] px-3 py-2 text-xs font-black text-[#247a31]"><CheckCircle2 className="size-4" />Задание отправлено на модерацию</p>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f8eb] px-3 py-2 text-xs font-black text-[#247a31]"><CheckCircle2 className="size-4" />Задание можно отправить на модерацию</p>
            )}
          </div>
          <button
            disabled={!canSubmit}
            onClick={submitTask}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.24)] transition hover:brightness-95 disabled:bg-[#ece8dc] disabled:text-black/34 disabled:shadow-none"
          >
            {submitting ? "Отправляем..." : submitLabel}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function ContactVisibilityCard({
  icon: Icon,
  title,
  text,
  active,
  onClick
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-32 items-start gap-4 rounded-[1.35rem] p-4 text-left transition duration-300",
        active
          ? "bg-brand shadow-[0_18px_42px_rgba(255,227,0,0.24)]"
          : "bg-[#fffdf7] shadow-[inset_0_0_0_1px_rgba(24,20,7,0.065)] hover:-translate-y-0.5 hover:bg-brand/12"
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", active ? "bg-black text-white" : "bg-white text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]")}>
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-base font-black">{title}</span>
        <span className="mt-2 block text-sm font-bold leading-6 text-black/56">{text}</span>
        <span className="mt-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-black text-black/55">
          {active ? "Выбранный сценарий" : "Выбрать сценарий"}
        </span>
      </span>
    </button>
  );
}

function FoundationLockedState({ moderationComment }: { moderationComment?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[1.8rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_24px_72px_rgba(34,28,8,0.06)] md:p-8">
      <div className="absolute -right-20 -top-24 size-72 rounded-full bg-brand/24 blur-3xl" />
      <div className="relative z-10 max-w-3xl">
        <span className="inline-flex rounded-full bg-brand/18 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]">Фонд на проверке</span>
        <h2 className="mt-5 text-4xl font-black leading-tight">Публикация заданий пока закрыта</h2>
        <p className="mt-4 text-base font-bold leading-7 text-black/58">После подтверждения администратором фонд сможет создавать задания и отправлять их на модерацию.</p>
        {moderationComment ? <p className="mt-5 rounded-[1.15rem] bg-[#fffdf7] p-4 text-sm font-bold leading-6 text-black/58">{moderationComment}</p> : null}
      </div>
    </section>
  );
}

function Field({ label, placeholder, value, defaultValue, onChange }: { label: string; placeholder: string; value?: string; defaultValue?: string; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <input value={value} defaultValue={defaultValue} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-bold outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/30 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-black outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function CityField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <input
        value={disabled ? "Онлайн" : value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Начните вводить город"
        list="foundation-russian-cities"
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-bold outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/30 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)] disabled:text-black/42"
      />
      <datalist id="foundation-russian-cities">
        {russianCities.map((cityName) => <option key={cityName} value={cityName} />)}
      </datalist>
    </label>
  );
}

function TextField({ label, placeholder, value, onChange, className }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={className}>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="mt-2 w-full resize-none rounded-2xl bg-[#fffdf7] px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/30 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
    </label>
  );
}

function ContactField({ icon: Icon, label, placeholder, value, onChange }: { icon: LucideIcon; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-[1.2rem] bg-[#fffdf7] p-4">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-black/38"><Icon className="size-4 text-black" />{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-3 h-10 w-full rounded-xl bg-white px-3 text-sm font-bold outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)] placeholder:text-black/28 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
    </label>
  );
}

function validateTaskForm(values: FoundationTaskFormValues, fundraisingDetected: boolean) {
  const messages: string[] = [];
  if (values.title.trim().length < 3) messages.push("Название должно быть не короче 3 символов.");
  if (values.description.trim().length < 10) messages.push("Описание должно быть не короче 10 символов.");
  if (values.format === "Офлайн" && !values.city.trim()) messages.push("Укажите город для офлайн-задания.");
  if (!values.hours.trim() || Number(values.hours.replace(",", ".")) <= 0) messages.push("Укажите волонтёрские часы больше нуля.");
  if (values.capacity.trim() && Number(values.capacity) <= 0) messages.push("Количество участников должно быть больше нуля.");
  if (values.deadline.trim() && !parseDateInput(values.deadline)) messages.push("Укажите дедлайн датой: 25.05.2026 или 25 мая 2026.");
  if (fundraisingDetected) messages.push("Уберите формулировки про сбор денег перед отправкой.");
  return messages;
}

function toTaskSubmitMessage(error: unknown) {
  const message = getApiErrorMessage(error);
  if (message.includes("fund is not approved")) return "Фонд ещё не одобрен администратором. После проверки можно будет отправлять задания.";
  if (message.includes("city is required")) return "Для офлайн-задания нужно указать город.";
  if (message.includes("task cannot be edited in current status")) return "Редактирование закрыто для опубликованных и завершённых заданий.";
  if (message.includes("deadline_at must not be later than starts_at")) return "Дедлайн отклика не может быть позже даты старта.";
  if (message.includes("invalid task status transition")) return "Задание уже отправлено или находится в статусе, из которого нельзя отправить повторно.";
  return message;
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso.toISOString();

  const numeric = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (numeric) {
    const [, day, month, year] = numeric;
    return new Date(Number(year), Number(month) - 1, Number(day), 12).toISOString();
  }

  const months: Record<string, number> = {
    апреля: 3,
    августа: 7,
    декабря: 11,
    июля: 6,
    июня: 5,
    марта: 2,
    мая: 4,
    ноября: 10,
    октября: 9,
    сентября: 8,
    февраля: 1,
    января: 0
  };
  const ru = /(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i.exec(trimmed);
  if (ru) {
    const [, day, monthName, year] = ru;
    const month = months[monthName.toLowerCase()];
    if (month !== undefined) return new Date(Number(year), month, Number(day), 12).toISOString();
  }

  return null;
}
