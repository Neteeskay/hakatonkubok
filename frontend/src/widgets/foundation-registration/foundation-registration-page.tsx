"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Phone, Send, ShieldCheck, Smartphone, UserRound, type LucideIcon } from "lucide-react";
import { Logo } from "@/widgets/navigation/logo";
import { ApiError, authService, fundsService, getApiErrorMessage } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import {
  foundationActivityOptions,
  foundationCategoryOptions,
  foundationSteps,
  initialFoundationDocuments,
  initialFoundationForm,
  preferredContactOptions,
  type FoundationDocumentItem,
  type FoundationRegistrationForm,
  type FoundationRegistrationStep
} from "@/widgets/foundation-registration/foundation-registration-data";
import { isOptionalUrlValid, maskPhone, validateFoundationStep } from "@/widgets/foundation-registration/foundation-registration-schema";
import { FoundationDocumentCard } from "@/widgets/foundation-registration/ui/foundation-document-card";
import { MediaUploadCard } from "@/widgets/foundation-registration/ui/media-upload-card";
import { FoundationStepper } from "@/widgets/foundation-registration/ui/stepper";

function getFundRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409 && error.message === "email already exists") {
    return "Пользователь с таким email уже зарегистрирован.";
  }

  return getApiErrorMessage(error);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function buildPlannedHelp(form: FoundationRegistrationForm) {
  const lines = [
    form.activityTypes.length ? `Виды помощи: ${form.activityTypes.join(", ")}` : "",
    form.telegram.trim() ? `Telegram: ${form.telegram.trim()}` : "",
    form.whatsapp.trim() ? `WhatsApp: ${form.whatsapp.trim()}` : "",
    `Предпочтительный способ связи: ${form.preferredContact}`
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : null;
}

export function FoundationRegistrationPage() {
  const [step, setStep] = useState<FoundationRegistrationStep>("main");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FoundationRegistrationForm>(initialFoundationForm);
  const [documents, setDocuments] = useState<FoundationDocumentItem[]>(initialFoundationDocuments);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const stepIndex = foundationSteps.findIndex((item) => item.id === step);
  const currentValid = validateFoundationStep(step, form);
  const uploadedCount = documents.filter((document) => document.fileName).length;
  const summaryReady = useMemo(() => validateFoundationStep("main", form) && validateFoundationStep("contacts", form), [form]);

  function update<K extends keyof FoundationRegistrationForm>(key: K, value: FoundationRegistrationForm[K]) {
    setSubmitError(null);
    setSubmitNotice(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArray(key: "categories" | "activityTypes", value: string) {
    setSubmitError(null);
    setSubmitNotice(null);
    setForm((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  function uploadDocument(id: string, file: File) {
    setSubmitError(null);
    setSubmitNotice(null);
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, file, status: "uploaded", fileName: file.name } : item));
  }

  function removeDocument(id: string) {
    setSubmitError(null);
    setSubmitNotice(null);
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, file: undefined, status: "empty", fileName: undefined } : item));
  }

  async function submitRegistration() {
    if (!currentValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitNotice(null);

    const accountEmail = form.accountEmail.trim().toLowerCase();

    try {
      await authService.registerFund({
        contact_email: optionalText(form.email),
        contact_person: optionalText(form.contactName),
        contact_phone: optionalText(form.phone),
        contact_position: optionalText(form.contactRole),
        description: optionalText(form.description),
        email: accountEmail,
        help_categories: form.categories,
        inn: optionalText(form.inn),
        name: form.name.trim(),
        ogrn: optionalText(form.ogrn),
        password: form.password,
        planned_help: buildPlannedHelp(form),
        region: optionalText(form.region),
        representative_full_name: form.contactName.trim(),
        representative_phone: optionalText(form.phone),
        website_url: optionalText(form.website)
      });

      if (form.logoFile) {
        await fundsService.uploadMyFundLogo(form.logoFile);
      }

      if (form.coverFile) {
        await fundsService.uploadMyFundCover(form.coverFile);
      }

      const documentsToUpload = documents.filter((document) => document.file);
      let failedUploads = 0;

      for (const document of documentsToUpload) {
        if (!document.file) continue;

        setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, status: "uploading" } : item));

        try {
          const uploadedDocument = await fundsService.uploadMyFundDocument({ documentType: document.id, file: document.file });
          setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, fileUrl: uploadedDocument.file_url, status: "uploaded" } : item));
        } catch {
          failedUploads += 1;
          setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, status: "error" } : item));
        }
      }

      if (failedUploads > 0) {
        setSubmitNotice("Фонд зарегистрирован, но часть документов не загрузилась. Их можно дозагрузить из профиля фонда.");
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(getFundRegisterErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (stepIndex < foundationSteps.length - 1) {
      setStep(foundationSteps[stepIndex + 1].id);
      return;
    }

    void submitRegistration();
  }

  if (submitted) {
    return <FoundationPendingScreen form={form} documents={documents} notice={submitNotice} onEdit={() => { setSubmitted(false); setStep("main"); }} />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdf7] px-4 py-5 text-black md:px-6">
      <section className="mx-auto max-w-[1360px]">
        <header className="flex items-center justify-between rounded-[1.5rem] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_54px_rgba(34,28,8,0.05)]">
          <Link href="/" className="block w-52"><Logo /></Link>
          <Link href="/login" className="hidden h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-black text-black md:inline-flex">Уже есть доступ <ArrowRight className="ml-2 size-4" /></Link>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_28px_80px_rgba(34,28,8,0.06)] md:p-8">
            <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative z-10 max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand/16 px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"><ShieldCheck className="size-4" />Онбординг фонда</span>
              <h1 className="mt-6 text-4xl font-black leading-[0.98] md:text-6xl">Регистрация фонда</h1>
              <p className="mt-5 max-w-3xl text-base font-bold leading-7 text-black/58 md:text-lg md:leading-8">Заполните профиль, контактное лицо и документы. После отправки заявка перейдёт в статус проверки.</p>
            </div>
          </div>
          <aside className="rounded-[2rem] bg-brand p-5 shadow-[0_28px_70px_rgba(255,227,0,0.22)]">
            <div className="rounded-[1.5rem] bg-white/72 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/45">Статус после отправки</p>
              <h2 className="mt-3 text-2xl font-black">Фонд на проверке</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-black/60">Публикация заданий станет доступна после подтверждения профиля и документов.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat value={`${uploadedCount}/5`} label="документов" />
              <MiniStat value={summaryReady ? "готово" : "нужно заполнить"} label="профиль" />
            </div>
          </aside>
        </section>

        <div className="mt-5">
          <FoundationStepper activeStep={step} />
        </div>

        <section className="mt-5 rounded-[1.8rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_24px_80px_rgba(34,28,8,0.06)] md:p-6">
          {step === "main" ? <MainInfoStep form={form} update={update} toggleArray={toggleArray} /> : null}
          {step === "contacts" ? <ContactsStep form={form} update={update} /> : null}
          {step === "documents" ? <DocumentsStep form={form} update={update} documents={documents} onUpload={uploadDocument} onRemove={removeDocument} /> : null}
          {step === "review" ? <ReviewStep form={form} documents={documents} /> : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-between">
            <button disabled={stepIndex === 0} onClick={() => setStep(foundationSteps[stepIndex - 1].id)} className="h-12 rounded-xl bg-[#fffdf7] px-5 text-sm font-black text-black/58 disabled:opacity-40">Назад</button>
            <button disabled={!currentValid || submitting} onClick={next} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.24)] disabled:bg-[#ece8dc] disabled:text-black/34 disabled:shadow-none">
              {submitting ? "Отправляем..." : step === "review" ? "Отправить заявку" : "Продолжить"}
              <ArrowRight className="size-4" />
            </button>
          </div>
          {submitError ? (
            <p className="mt-4 rounded-2xl bg-[#fff1f1] p-4 text-sm font-bold leading-6 text-[#c83c3c]" role="alert">
              {submitError}
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function MainInfoStep({ form, update, toggleArray }: { form: FoundationRegistrationForm; update: <K extends keyof FoundationRegistrationForm>(key: K, value: FoundationRegistrationForm[K]) => void; toggleArray: (key: "categories" | "activityTypes", value: string) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Наименование фонда" value={form.name} onChange={(value) => update("name", value)} placeholder="Фонд добрых спортивных инициатив" />
        <FormField label="Регион деятельности" value={form.region} onChange={(value) => update("region", value)} placeholder="Москва и Московская область" />
        <FormField label="ИНН" value={form.inn} onChange={(value) => update("inn", value.replace(/\D/g, "").slice(0, 12))} placeholder="7701234567" invalid={form.inn.length > 0 && !/^\d{10}(\d{2})?$/.test(form.inn)} />
        <FormField label="ОГРН" value={form.ogrn} onChange={(value) => update("ogrn", value.replace(/\D/g, "").slice(0, 15))} placeholder="1127700000000" invalid={form.ogrn.length > 0 && !/^\d{13,15}$/.test(form.ogrn)} />
        <FormField label="Сайт" value={form.website} onChange={(value) => update("website", value)} placeholder="fond.ru или https://fond.ru" invalid={form.website.trim().length > 0 && !isOptionalUrlValid(form.website)} />
        <FormField label="Email для входа" value={form.accountEmail} onChange={(value) => update("accountEmail", value)} placeholder="account@fond.ru" icon={Mail} invalid={form.accountEmail.length > 0 && !/\S+@\S+\.\S+/.test(form.accountEmail)} />
        <FormField label="Пароль" value={form.password} onChange={(value) => update("password", value)} placeholder="Минимум 6 символов" icon={LockKeyhole} inputType="password" invalid={form.password.length > 0 && form.password.length < 6} />
        <FormField label="Подтверждение пароля" value={form.passwordConfirm} onChange={(value) => update("passwordConfirm", value)} placeholder="Повторите пароль" icon={LockKeyhole} inputType="password" invalid={form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm} />
        <TextField label="Краткое описание деятельности" value={form.description} onChange={(value) => update("description", value)} placeholder="Расскажите, кому помогает фонд и какие активности проводит" />
        <ChipGroup label="Категории помощи" options={foundationCategoryOptions} selected={form.categories} onToggle={(value) => toggleArray("categories", value)} />
        <ChipGroup label="Виды волонтёрской помощи" options={foundationActivityOptions} selected={form.activityTypes} onToggle={(value) => toggleArray("activityTypes", value)} />
      </div>
      <div className="grid gap-4">
        <MediaUploadCard title="Логотип фонда" description="Будет виден в профиле, карточках заданий и откликах." variant="logo" uploaded={form.logoUploaded} fileName={form.logoFileName} onUpload={(file) => {
          update("logoUploaded", Boolean(file));
          update("logoFile", file);
          update("logoFileName", file?.name);
        }} />
        <MediaUploadCard title="Обложка фонда" description="Горизонтальный баннер для публичной страницы фонда." variant="cover" uploaded={form.coverUploaded} fileName={form.coverFileName} onUpload={(file) => {
          update("coverUploaded", Boolean(file));
          update("coverFile", file);
          update("coverFileName", file?.name);
        }} />
      </div>
    </div>
  );
}

function ContactsStep({ form, update }: { form: FoundationRegistrationForm; update: <K extends keyof FoundationRegistrationForm>(key: K, value: FoundationRegistrationForm[K]) => void }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand"><UserRound className="size-5" /></span>
        <div>
          <h2 className="text-2xl font-black">Контактное лицо</h2>
          <p className="text-sm font-bold text-black/48">Координатор, который отвечает за проверку и волонтёрские активности.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Имя контактного лица" value={form.contactName} onChange={(value) => update("contactName", value)} placeholder="Мария Иванова" />
        <FormField label="Должность" value={form.contactRole} onChange={(value) => update("contactRole", value)} placeholder="Координатор программ" />
        <FormField label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="volunteer@fond.ru" icon={Mail} invalid={form.email.length > 0 && !/\S+@\S+\.\S+/.test(form.email)} />
        <FormField label="Телефон" value={form.phone} onChange={(value) => update("phone", maskPhone(value))} placeholder="+7 900 000-00-00" icon={Phone} invalid={form.phone.length > 0 && form.phone.replace(/\D/g, "").length < 10} />
        <FormField label="Telegram" value={form.telegram} onChange={(value) => update("telegram", value)} placeholder="@fond_volunteer" icon={Send} />
        <FormField label="WhatsApp" value={form.whatsapp} onChange={(value) => update("whatsapp", maskPhone(value))} placeholder="+7 900 000-00-00" icon={Smartphone} />
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">Предпочтительный способ связи</span>
          <select value={form.preferredContact} onChange={(event) => update("preferredContact", event.target.value as FoundationRegistrationForm["preferredContact"])} className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-black outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]">
            {preferredContactOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

function DocumentsStep({ form, update, documents, onUpload, onRemove }: { form: FoundationRegistrationForm; update: <K extends keyof FoundationRegistrationForm>(key: K, value: FoundationRegistrationForm[K]) => void; documents: FoundationDocumentItem[]; onUpload: (id: string, file: File) => void; onRemove: (id: string) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h2 className="text-2xl font-black">Документы для проверки фонда</h2>
        <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-black/48">Загрузите доступные документы. Их можно заменить или дозагрузить позже из профиля фонда.</p>
        <div className="mt-5 grid gap-3">
          {documents.map((document) => <FoundationDocumentCard key={document.id} document={document} onUpload={(file) => onUpload(document.id, file)} onRemove={() => onRemove(document.id)} />)}
        </div>
      </div>
      <div className="grid gap-4">
        <MediaUploadCard title="Логотип фонда" description="Можно загрузить сейчас или позже." variant="logo" uploaded={form.logoUploaded} fileName={form.logoFileName} onUpload={(file) => {
          update("logoUploaded", Boolean(file));
          update("logoFile", file);
          update("logoFileName", file?.name);
        }} />
        <MediaUploadCard title="Обложка фонда" description="Используется на публичной странице." variant="cover" uploaded={form.coverUploaded} fileName={form.coverFileName} onUpload={(file) => {
          update("coverUploaded", Boolean(file));
          update("coverFile", file);
          update("coverFileName", file?.name);
        }} />
      </div>
    </div>
  );
}

function ReviewStep({ form, documents }: { form: FoundationRegistrationForm; documents: FoundationDocumentItem[] }) {
  const uploaded = documents.filter((document) => document.fileName);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="text-2xl font-black">Проверьте заявку</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReviewItem label="Фонд" value={form.name || "Не заполнено"} />
          <ReviewItem label="Регион" value={form.region} />
          <ReviewItem label="ИНН / ОГРН" value={`${form.inn || "—"} / ${form.ogrn || "—"}`} />
          <ReviewItem label="Email для входа" value={form.accountEmail || "Не заполнено"} />
          <ReviewItem label="Контакт" value={`${form.contactName || "—"}, ${form.preferredContact}`} />
          <ReviewItem label="Категории" value={form.categories.join(", ")} />
          <ReviewItem label="Активности" value={form.activityTypes.join(", ")} />
        </div>
      </section>
      <aside className="rounded-[1.45rem] bg-[#fffdf7] p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-black/38">Документы</p>
        <p className="mt-3 text-4xl font-black">{uploaded.length}/{documents.length}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-black/48">Документы можно дозагрузить из профиля фонда после отправки заявки.</p>
      </aside>
    </div>
  );
}

function FoundationPendingScreen({ form, documents, notice, onEdit }: { form: FoundationRegistrationForm; documents: FoundationDocumentItem[]; notice?: string | null; onEdit: () => void }) {
  return (
    <main className="min-h-screen bg-[#fffdf7] px-4 py-5 md:px-6">
      <section className="mx-auto max-w-[1120px]">
        <header className="flex items-center justify-between rounded-[1.5rem] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_18px_54px_rgba(34,28,8,0.05)]">
          <Link href="/" className="block w-52"><Logo /></Link>
          <Link href="/login" className="hidden h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-black text-black md:inline-flex">Войти</Link>
        </header>
        <section className="mt-6 overflow-hidden rounded-[2rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_28px_80px_rgba(34,28,8,0.06)] md:p-8">
          <span className="inline-flex rounded-full bg-brand/18 px-4 py-2 text-xs font-black uppercase tracking-[0.14em]">Фонд на проверке</span>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{form.name || "Заявка фонда"}</h1>
          <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-black/58">Заявка отправлена. Пока она находится на проверке, публикация заданий недоступна.</p>
          {notice ? <p className="mt-5 rounded-[1.15rem] bg-[#fff1f1] p-4 text-sm font-bold leading-6 text-[#c83c3c]">{notice}</p> : null}
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <MiniStat value={form.categories.length.toString()} label="категорий помощи" />
            <MiniStat value={documents.filter((document) => document.fileName).length.toString()} label="документов" />
            <MiniStat value={form.preferredContact} label="способ связи" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={onEdit} className="h-12 rounded-xl bg-[#fffdf7] px-5 text-sm font-black text-black">Редактировать заявку</button>
            <Link href="/foundation" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black">Открыть кабинет <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function FormField({ label, value, onChange, placeholder, invalid, icon: Icon, inputType = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; invalid?: boolean; icon?: LucideIcon; inputType?: "text" | "password" }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <span className={cn("mt-2 flex h-12 items-center gap-3 rounded-2xl bg-[#fffdf7] px-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus-within:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]", invalid && "shadow-[inset_0_0_0_2px_rgba(200,60,60,0.5)]")}>
        {Icon ? <Icon className="size-4 text-black/42" /> : null}
        <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/30" />
      </span>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-28 w-full resize-none rounded-2xl bg-[#fffdf7] px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] placeholder:text-black/30 focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
    </label>
  );
}

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="md:col-span-2">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return <button type="button" key={option} onClick={() => onToggle(option)} className={cn("h-10 rounded-full px-4 text-xs font-black transition", active ? "bg-brand text-black shadow-[0_10px_22px_rgba(255,227,0,0.24)]" : "bg-[#f4f3ee] text-black/58 hover:bg-brand/12 hover:text-black")}>{option}</button>;
        })}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] bg-[#fffdf7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-black/70">{value}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] bg-white/72 p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[11px] font-black text-black/50">{label}</p>
    </div>
  );
}
