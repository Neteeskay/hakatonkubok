"use client";

import { useMemo, useState } from "react";
<<<<<<< Updated upstream
import { ArrowRight, CheckCircle2, Link2, Mail, MessageCircle, Phone, Send, Smartphone, X, type LucideIcon } from "lucide-react";
import { getApiErrorMessage } from "@/shared/api";
=======
import { ArrowRight, CheckCircle2, Eye, Link2, LockKeyhole, Mail, MessageCircle, Phone, Send, Smartphone, X, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
>>>>>>> Stashed changes
import { SkillsInput } from "@/widgets/volunteer-profile/ui/skills-input";
import type { FoundationContactVisibility, FoundationTaskItem } from "@/widgets/foundation/foundation-data";

const forbiddenWords = ["деньги", "сбор средств", "пожертвования", "донат", "перевод", "fundraising", "собрать сумму"];
const categories = ["События", "Логистика", "IT / разработка", "Дизайн", "Юридическая помощь", "Коммуникации", "Контент", "Образование", "Помощь детям", "Экология", "Спорт", "Адресная помощь", "Pro bono"];
const formats = ["Онлайн", "Офлайн"];
const periodicity = ["Разовое", "Регулярное", "По договорённости"];
const cities = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Онлайн"];

export interface FoundationTaskFormValues {
  capacity: string;
  category: string;
  chatLink: string;
  city: string;
  contactNote: string;
  deadline: string;
  description: string;
  email: string;
  format: "Онлайн" | "Офлайн";
  hours: string;
  instructions: string;
  location: string;
  periodicity: string;
  phone: string;
  requirements: string[];
  skills: string[];
  telegram: string;
  title: string;
  whatsapp: string;
}

export function CreateTaskForm({
  canPublish = true,
  moderationComment,
  initialTask,
  submitLabel = "Отправить на модерацию",
  onSubmit
}: {
  canPublish?: boolean;
  moderationComment?: string;
  initialTask?: FoundationTaskItem;
  submitLabel?: string;
  onSubmit?: (values: FoundationTaskFormValues) => Promise<void> | void;
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [instructions, setInstructions] = useState("");
  const [requirements, setRequirements] = useState<string[]>(["Коммуникабельность"]);
  const [skills, setSkills] = useState<string[]>(initialTask?.category === "Pro bono" ? ["Презентации"] : ["Логистика"]);
  const [format, setFormat] = useState(initialTask?.format === "Гибрид" ? "Офлайн" : initialTask?.format ?? "Офлайн");
  const [category, setCategory] = useState(initialTask?.category ?? "События");
  const [city, setCity] = useState(initialTask?.city === "Онлайн" ? "Онлайн" : initialTask?.city ?? "Москва");
  const [period, setPeriod] = useState(initialTask?.period?.includes("Регуляр") ? "Регулярное" : "Разовое");
<<<<<<< Updated upstream
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState(initialTask?.deadline ?? "");
  const [capacity, setCapacity] = useState(initialTask ? String(initialTask.capacity) : "");
  const [hours, setHours] = useState(initialTask ? String(initialTask.hours) : "");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
=======
  const [contactVisibility, setContactVisibility] = useState<FoundationContactVisibility>(initialTask?.contactVisibility ?? "after_acceptance");
  const [telegram, setTelegram] = useState(initialTask?.contacts.telegram ?? "");
  const [whatsapp, setWhatsapp] = useState(initialTask?.contacts.whatsapp ?? "");
  const [email, setEmail] = useState(initialTask?.contacts.email ?? "");
  const [phone, setPhone] = useState(initialTask?.contacts.phone ?? "");
  const [chatLink, setChatLink] = useState(initialTask?.contacts.chatLink ?? "");
  const [contactNote, setContactNote] = useState(initialTask?.contacts.instruction ?? "");
>>>>>>> Stashed changes

  const text = `${title} ${description} ${instructions} ${contactNote}`.toLowerCase();
  const fundraisingDetected = useMemo(() => forbiddenWords.some((word) => text.includes(word)), [text]);
  const canSubmit = canPublish && !fundraisingDetected && title.trim().length >= 3 && description.trim().length >= 10 && !submitting;

  async function submitTask() {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit?.({
        capacity,
        category,
        chatLink,
        city,
        contactNote,
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
        telegram,
        title,
        whatsapp
      });
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
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
          <SelectField label="Категория помощи" value={category} onChange={setCategory} options={categories} />
          <TextField label="Описание" placeholder="Кратко опишите, что нужно сделать волонтёру" value={description} onChange={setDescription} className="md:col-span-2" />
          <SelectField label="Формат участия" value={format} onChange={(value) => setFormat(value as "Онлайн" | "Офлайн")} options={formats} />
          <SelectField label="Город" value={city} onChange={setCity} options={cities} />
          <Field label="Адрес или ссылка" placeholder={format === "Онлайн" ? "Ссылка появится после принятия" : "Москва, парк Сокольники"} value={location} onChange={setLocation} />
          <Field label="Дедлайн отклика" placeholder="25 мая 2026" value={deadline} onChange={setDeadline} />
          <SelectField label="Периодичность" value={period} onChange={setPeriod} options={periodicity} />
          <Field label="Количество участников" placeholder="12" value={capacity} onChange={(value) => setCapacity(value.replace(/\D/g, ""))} />
          <Field label="Волонтёрские часы" placeholder="4" value={hours} onChange={(value) => setHours(value.replace(/[^\d.,]/g, ""))} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <SkillsInput label="Требования" description="Что важно для участия: опыт, soft skills, возрастные ограничения." value={requirements} onChange={setRequirements} groups={["interest", "professional"]} />
        <SkillsInput label="Навыки" description="Профессиональные навыки, если задание pro bono или требует компетенций." value={skills} onChange={setSkills} groups={["professional", "probono"]} tone="violet" />
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
            ) : fundraisingDetected ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-black text-[#c83c3c]"><X className="size-4" />Уберите формулировки про сбор денег перед отправкой</p>
            ) : submitSuccess ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f8eb] px-3 py-2 text-xs font-black text-[#247a31]"><CheckCircle2 className="size-4" />Задание отправлено на модерацию</p>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f8eb] px-3 py-2 text-xs font-black text-[#247a31]"><CheckCircle2 className="size-4" />Задание можно отправить на модерацию</p>
            )}
          </div>
          <button
            disabled={!canSubmit}
<<<<<<< Updated upstream
            onClick={submitTask}
=======
            onClick={() => onSubmit?.({
              title,
              description,
              category,
              city,
              format: format as FoundationTaskItem["format"],
              status: "moderation",
              moderationComment: undefined,
              contactVisibility,
              contacts: { telegram, whatsapp, email, phone, chatLink, instruction: contactNote }
            })}
>>>>>>> Stashed changes
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-black outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
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
