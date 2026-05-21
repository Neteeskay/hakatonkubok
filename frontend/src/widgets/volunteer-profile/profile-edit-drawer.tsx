"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, Loader2, X } from "lucide-react";
import { resolveApiFileUrl } from "@/shared/api/config";
import { getApiErrorMessage } from "@/shared/api/errors";
import { tasksService } from "@/shared/api/services/tasks";
import { SoftBadge } from "@/widgets/volunteer-profile/profile-ui";
import { skillOptions, type SkillOption } from "@/widgets/volunteer-profile/skills-dictionary";
import { SkillsInput } from "@/widgets/volunteer-profile/ui/skills-input";

export interface ProfileDraft {
  avatarUrl: string | null;
  name: string;
  city: string;
  email: string;
  phone: string;
  about: string;
  interests: string[];
  skills: string[];
  proBono: string[];
}

export const emptyProfileDraft: ProfileDraft = {
  about: "",
  avatarUrl: null,
  city: "",
  email: "",
  interests: [],
  name: "",
  phone: "",
  proBono: [],
  skills: []
};

export type ProfileEditFocus = "basic" | "skills";
export type ProfileSkillsSnapshot = Pick<ProfileDraft, "interests" | "skills" | "proBono">;

export function ProfileEditDrawer({
  open,
  onClose,
  initialFocus = "basic",
  profileDraft,
  skillsSnapshot,
  onAvatarUpload,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  initialFocus?: ProfileEditFocus;
  profileDraft: ProfileDraft;
  skillsSnapshot: ProfileSkillsSnapshot;
  onAvatarUpload?: (file: File) => Promise<string | null> | string | null;
  onSave: (draft: ProfileDraft) => Promise<void> | void;
}) {
  const hydratedDraft = useMemo(() => ({ ...emptyProfileDraft, ...profileDraft, ...skillsSnapshot }), [profileDraft, skillsSnapshot]);
  const [draft, setDraft] = useState(hydratedDraft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [dictionaryOptions, setDictionaryOptions] = useState<SkillOption[]>(skillOptions);
  const skillsRef = useRef<HTMLDivElement>(null);
  const isValid = draft.name.trim().length > 2 && draft.email.includes("@") && draft.phone.trim().length >= 7;
  const initials = getInitials(draft.name || draft.email);

  useEffect(() => {
    if (open) {
      setDraft(hydratedDraft);
      setSaving(false);
      setSaved(false);
      setSaveError(null);
      setAvatar(resolveApiFileUrl(hydratedDraft.avatarUrl));
      setAvatarFile(null);
      if (initialFocus === "skills") {
        window.setTimeout(() => skillsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 220);
      }
    }
  }, [hydratedDraft, initialFocus, open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    tasksService.getTaskSkills()
      .then((options) => {
        if (mounted && options.length) setDictionaryOptions(options);
      })
      .catch(() => {
        if (mounted) setDictionaryOptions(skillOptions);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  function update(field: keyof ProfileDraft, value: string) {
    setSaved(false);
    setSaveError(null);
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateList(field: keyof ProfileSkillsSnapshot, value: string[]) {
    setSaved(false);
    setSaveError(null);
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleAvatar(file?: File) {
    if (!file) return;
    setAvatar(URL.createObjectURL(file));
    setAvatarFile(file);
  }

  async function save() {
    if (!isValid) return;
    setSaving(true);
    setSaveError(null);

    try {
      const uploadedAvatarUrl = avatarFile ? await onAvatarUpload?.(avatarFile) : draft.avatarUrl;
      await onSave({ ...draft, avatarUrl: uploadedAvatarUrl ?? draft.avatarUrl });
      setSaved(true);
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 bg-black/18 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            className="ml-auto h-full w-full max-w-[620px] overflow-y-auto rounded-l-[2rem] bg-[#fffdf7] p-6 shadow-[0_30px_90px_rgba(34,28,8,0.18)]"
            initial={{ x: 90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Редактирование</p>
                <h2 className="mt-2 text-3xl font-black">Редактировать профиль</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-black/56">Изменения сохраняются в профиле волонтёра.</p>
              </div>
              <button onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]" aria-label="Закрыть">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-7 rounded-[1.45rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
              <div className="flex items-center gap-4">
                <div className="relative grid size-24 place-items-center overflow-hidden rounded-full bg-brand/20 text-3xl font-black">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
                  <label className="absolute bottom-1 right-1 grid size-9 cursor-pointer place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(34,28,8,0.16)]">
                    <Camera className="size-4" />
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleAvatar(event.target.files?.[0])} />
                  </label>
                </div>
                <div>
                  <p className="font-black">Фото профиля</p>
                  <p className="mt-1 text-sm text-black/54">PNG/JPG.</p>
                  {avatar ? <SoftBadge tone="green">Загружено</SoftBadge> : null}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Имя" value={draft.name} onChange={(value) => update("name", value)} invalid={draft.name.trim().length <= 2} />
              <Field label="Город" value={draft.city} onChange={(value) => update("city", value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" value={draft.email} onChange={(value) => update("email", value)} invalid={!draft.email.includes("@")} />
                <Field label="Телефон" value={draft.phone} onChange={(value) => update("phone", value)} invalid={draft.phone.trim().length < 7} />
              </div>
              <TextField label="О себе" value={draft.about} onChange={(value) => update("about", value)} />
              <div ref={skillsRef} className="scroll-mt-6 rounded-[1.45rem] bg-[#fbfaf4] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/38">Навыки и интересы</p>
                <div className="mt-4 grid gap-4">
                  <SkillsInput
                    label="Мои навыки и интересы"
                    description="Выберите направления помощи, чтобы лента точнее подбирала задания."
                    value={draft.interests}
                    onChange={(value) => updateList("interests", value)}
                    groups={["interest"]}
                    options={dictionaryOptions}
                    tone="brand"
                  />
                  <SkillsInput
                    label="Профессиональные навыки"
                    description="Навыки для обычных и корпоративных задач: коммуникации, аналитика, дизайн, менеджмент."
                    value={draft.skills}
                    onChange={(value) => updateList("skills", value)}
                    groups={["professional", "probono"]}
                    options={dictionaryOptions}
                    tone="violet"
                  />
                  <SkillsInput
                    label="Профессиональные навыки Pro Bono"
                    description="Компетенции, которые можно предложить фондам как экспертную помощь."
                    value={draft.proBono}
                    onChange={(value) => updateList("proBono", value)}
                    groups={["probono", "professional"]}
                    options={dictionaryOptions}
                    tone="brand"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 rounded-[1.35rem] bg-white/94 p-4 shadow-[0_-16px_46px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-6">
                  {!isValid ? <p className="text-sm font-bold text-red-500">Проверьте имя, email и телефон</p> : null}
                  {saved ? <p className="flex items-center gap-2 text-sm font-bold text-[#247a31]"><CheckCircle2 className="size-4" />Сохранено</p> : null}
                  {saveError ? <p className="text-sm font-bold text-red-500">{saveError}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDraft(hydratedDraft)} className="h-12 rounded-xl bg-white px-5 text-sm font-black text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.1)]">Отменить</button>
                  <button disabled={!isValid || saving} onClick={save} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] disabled:opacity-45">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "В";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase();
}

function Field({ label, value, onChange, invalid }: { label: string; value: string; onChange: (value: string) => void; invalid?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-12 w-full rounded-2xl bg-white px-4 text-sm font-bold outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)] ${invalid ? "shadow-[inset_0_0_0_2px_rgba(239,68,68,0.72)]" : ""}`}
      />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-black/38">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-2 w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 outline-none shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]"
      />
    </label>
  );
}
