"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, Eye, Mail, MessageCircle, Pencil, Phone, Save, X, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  foundationCategoryOptions,
  foundationActivityOptions,
  type FoundationDocumentItem
} from "@/widgets/foundation-registration/foundation-registration-data";
import { FoundationDocumentCard } from "@/widgets/foundation-registration/ui/foundation-document-card";
import { MediaUploadCard } from "@/widgets/foundation-registration/ui/media-upload-card";
import { FoundationMetricCard } from "@/widgets/foundation/ui/foundation-metric-card";
import { FoundationStatusBadge } from "@/widgets/foundation/ui/foundation-status-badge";
import { FoundationTaskCard } from "@/widgets/foundation/ui/foundation-task-card";
import { currentFoundation, foundationMetrics, foundationTasks } from "@/widgets/foundation/foundation-data";
import {
  foundationProfileDocuments,
  initialFoundationProfile,
  type FoundationProfileForm
} from "@/widgets/foundation/foundation-profile-data";

export function FoundationProfileWorkspace() {
  const [profile, setProfile] = useState<FoundationProfileForm>(initialFoundationProfile);
  const [draft, setDraft] = useState<FoundationProfileForm>(initialFoundationProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState<FoundationDocumentItem[]>(foundationProfileDocuments);
  const publicTasks = useMemo(() => foundationTasks.filter((task) => task.status === "published" || task.status === "completed"), []);

  function beginEdit() {
    setDraft(profile);
    setSaved(false);
    setEditing(true);
  }

  function saveProfile() {
    setProfile(draft);
    setEditing(false);
    setSaved(true);
  }

  function update<K extends keyof FoundationProfileForm>(key: K, value: FoundationProfileForm[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "categories" | "activityTypes", value: string) {
    setDraft((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  function uploadDocument(id: string) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, status: "uploaded", fileName: `${item.id}-updated.pdf` } : item));
  }

  function removeDocument(id: string) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, status: "empty", fileName: undefined } : item));
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.8rem] bg-white shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="relative min-h-[260px] bg-[#fff9cf]">
          <div className="absolute inset-0 bg-[url('/backTaskVolounteer.png')] bg-cover bg-center opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/12" />
          <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <FoundationStatusBadge tone="green">{currentFoundation.trust}</FoundationStatusBadge>
              <div className="flex flex-wrap gap-2">
                <button onClick={beginEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black shadow-[0_12px_30px_rgba(34,28,8,0.08)] transition hover:-translate-y-0.5">
                  <Pencil className="size-4" />
                  Редактировать
                </button>
                <Link href="/preview/foundations/fond-001" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black shadow-[0_12px_30px_rgba(255,227,0,0.24)] transition hover:-translate-y-0.5">
                  <Eye className="size-4" />
                  Preview
                </Link>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[120px_1fr] md:items-end">
              <div className="grid size-28 place-items-center overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(34,28,8,0.12)]">
                <Image src="/logo.png" alt="Логотип фонда" width={84} height={84} className="h-auto w-20 object-contain" />
              </div>
              <div>
                <h2 className="max-w-4xl text-4xl font-black leading-[0.98] md:text-5xl">{profile.name}</h2>
                <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-black/58 md:text-base">{profile.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.categories.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-black/58 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">{item}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {saved ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e8f8eb] px-5 py-4 text-sm font-black text-[#247a31]">
          <CheckCircle2 className="size-5" />
          Профиль фонда сохранён. Изменения отражаются в публичной странице и карточках заданий.
        </div>
      ) : null}

      {editing ? (
        <FoundationProfileEditor
          draft={draft}
          documents={documents}
          update={update}
          toggleList={toggleList}
          onUploadDocument={uploadDocument}
          onRemoveDocument={removeDocument}
          onCancel={() => setEditing(false)}
          onSave={saveProfile}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {foundationMetrics.map((metric) => <FoundationMetricCard key={metric.label} {...metric} />)}
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <ProfileBlock title="Публичные данные" action={<Link href="/preview/foundations/fond-001" className="text-sm font-black text-black/48 hover:text-black">Открыть →</Link>}>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoPill label="Регион" value={profile.region} />
              <InfoPill label="Юридические данные" value={`ИНН ${profile.inn} / ОГРН ${profile.ogrn}`} />
              <InfoPill label="Сайт" value={profile.website} />
              <InfoPill label="Соцсети" value={profile.socials} />
            </div>
          </ProfileBlock>

          <ProfileBlock title="Активные и завершённые задания">
            <div className="space-y-3">
              {publicTasks.map((task) => <FoundationTaskCard key={task.id} task={task} compact />)}
            </div>
          </ProfileBlock>
        </div>

        <aside className="space-y-4">
          <ProfileBlock title="Контактное лицо">
            <div className="rounded-[1.25rem] bg-[#fffdf7] p-4">
              <p className="text-lg font-black">{profile.contactName}</p>
              <p className="mt-1 text-sm font-bold text-black/45">{profile.contactRole}</p>
              <div className="mt-4 space-y-3">
                <ContactLine icon={Mail} value={profile.email} />
                <ContactLine icon={Phone} value={profile.phone} />
                <ContactLine icon={MessageCircle} value={profile.telegram} />
              </div>
            </div>
          </ProfileBlock>

          <ProfileBlock title="Документы">
            <div className="space-y-3">
              {documents.slice(0, 3).map((document) => <FoundationDocumentCard key={document.id} document={document} onUpload={() => uploadDocument(document.id)} onRemove={() => removeDocument(document.id)} />)}
            </div>
          </ProfileBlock>
        </aside>
      </section>
    </div>
  );
}

function FoundationProfileEditor({
  draft,
  documents,
  update,
  toggleList,
  onUploadDocument,
  onRemoveDocument,
  onCancel,
  onSave
}: {
  draft: FoundationProfileForm;
  documents: FoundationDocumentItem[];
  update: <K extends keyof FoundationProfileForm>(key: K, value: FoundationProfileForm[K]) => void;
  toggleList: (key: "categories" | "activityTypes", value: string) => void;
  onUploadDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-[1.8rem] bg-white p-5 shadow-[0_24px_72px_rgba(34,28,8,0.06),inset_0_0_0_1px_rgba(24,20,7,0.055)] md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/36">Редактирование</p>
          <h2 className="mt-2 text-3xl font-black">Профиль фонда</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#fffdf7] px-4 text-sm font-black text-black/56 transition hover:bg-[#f4f3ee]"><X className="size-4" />Отмена</button>
          <button onClick={onSave} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-black shadow-[0_12px_30px_rgba(255,227,0,0.22)]"><Save className="size-4" />Сохранить</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileEditField label="Название фонда" value={draft.name} onChange={(value) => update("name", value)} />
          <ProfileEditField label="Регион" value={draft.region} onChange={(value) => update("region", value)} />
          <ProfileEditField label="ИНН" value={draft.inn} onChange={(value) => update("inn", value.replace(/\D/g, "").slice(0, 12))} />
          <ProfileEditField label="ОГРН" value={draft.ogrn} onChange={(value) => update("ogrn", value.replace(/\D/g, "").slice(0, 15))} />
          <ProfileEditField label="Email" value={draft.email} onChange={(value) => update("email", value)} />
          <ProfileEditField label="Телефон" value={draft.phone} onChange={(value) => update("phone", value)} />
          <ProfileEditField label="Telegram" value={draft.telegram} onChange={(value) => update("telegram", value)} />
          <ProfileEditField label="WhatsApp" value={draft.whatsapp} onChange={(value) => update("whatsapp", value)} />
          <ProfileEditField label="Сайт" value={draft.website} onChange={(value) => update("website", value)} />
          <ProfileEditField label="Соцсети" value={draft.socials} onChange={(value) => update("socials", value)} />
          <ProfileEditField label="Контактное лицо" value={draft.contactName} onChange={(value) => update("contactName", value)} />
          <ProfileEditField label="Должность" value={draft.contactRole} onChange={(value) => update("contactRole", value)} />
          <label className="md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">Описание фонда</span>
            <textarea value={draft.description} onChange={(event) => update("description", event.target.value)} className="mt-2 min-h-28 w-full resize-none rounded-2xl bg-[#fffdf7] px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
          </label>
          <ChipEditor title="Категории помощи" options={foundationCategoryOptions} selected={draft.categories} onToggle={(value) => toggleList("categories", value)} />
          <ChipEditor title="Типы активностей" options={foundationActivityOptions} selected={draft.activityTypes} onToggle={(value) => toggleList("activityTypes", value)} />
        </div>

        <aside className="space-y-4">
          <MediaUploadCard title="Логотип фонда" description="Показывается в профиле, заданиях и карточках откликов." variant="logo" uploaded={draft.logoUploaded} onUpload={() => update("logoUploaded", true)} />
          <MediaUploadCard title="Обложка фонда" description="Формирует первый экран публичной страницы фонда." variant="cover" uploaded={draft.coverUploaded} onUpload={() => update("coverUploaded", true)} />
        </aside>
      </div>

      <ProfileBlock title="Документы для модерации" className="mt-6">
        <div className="grid gap-3 lg:grid-cols-2">
          {documents.map((document) => <FoundationDocumentCard key={document.id} document={document} onUpload={() => onUploadDocument(document.id)} onRemove={() => onRemoveDocument(document.id)} />)}
        </div>
      </ProfileBlock>
    </section>
  );
}

function ProfileBlock({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.6rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.05),inset_0_0_0_1px_rgba(24,20,7,0.055)]", className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-black">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProfileEditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl bg-[#fffdf7] px-4 text-sm font-bold outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]" />
    </label>
  );
}

function ChipEditor({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="md:col-span-2">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/36">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} type="button" onClick={() => onToggle(option)} className={cn("h-10 rounded-full px-4 text-xs font-black transition", active ? "bg-brand text-black shadow-[0_10px_22px_rgba(255,227,0,0.22)]" : "bg-[#f4f3ee] text-black/58 hover:bg-brand/12 hover:text-black")}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-[#fffdf7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/34">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-black/70">{value}</p>
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-black text-black/62">
      <span className="grid size-9 place-items-center rounded-xl bg-white">
        <Icon className="size-4" />
      </span>
      {value}
    </div>
  );
}
