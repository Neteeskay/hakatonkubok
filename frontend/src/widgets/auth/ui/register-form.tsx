"use client";

import { useMemo, useState, type FormEvent } from "react";
import { LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { interestOptions, skillOptions } from "@/widgets/auth/model/auth-data";
import {
  buildVolunteerRegisterRequest,
  defaultVolunteerRegistrationForm,
  isVolunteerRegistrationValid
} from "@/widgets/auth/model/volunteer-registration";
import { useVolunteerRegistration } from "@/widgets/auth/model/use-volunteer-registration";
import { AuthField, OptionChips } from "@/widgets/auth/ui/auth-field";
import { RegistrationRoleCards } from "@/widgets/auth/ui/registration-role-cards";
import type { RegistrationRole } from "@/widgets/auth/model/auth-types";

export function RegisterForm() {
  const [role, setRole] = useState<RegistrationRole>("volunteer");
  const [form, setForm] = useState(defaultVolunteerRegistrationForm);
  const [interests, setInterests] = useState(["Экология", "Образование"]);
  const [skills, setSkills] = useState(["Презентации", "Дизайн"]);
  const [agree, setAgree] = useState(false);
  const { clearFeedback, error, registerVolunteer, submitting, success } = useVolunteerRegistration();
  const valid = useMemo(() => {
    return isVolunteerRegistrationValid({ agree, form, interests });
  }, [form, interests, agree]);

  function update(field: keyof typeof form, value: string) {
    clearFeedback();
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggle(list: string[], setter: (value: string[]) => void, value: string) {
    clearFeedback();
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;

    await registerVolunteer(buildVolunteerRegisterRequest({ form, interests, skills }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-3xl font-black">Регистрация волонтёра</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Профиль помогает подбирать задания, pro bono активности и корректно учитывать часы.</p>
      <div className="mt-5">
        <RegistrationRoleCards value={role} onChange={setRole} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AuthField label="Имя" value={form.firstName} onChange={(value) => update("firstName", value)} placeholder="Анна" icon={UserRound} />
        <AuthField label="Фамилия" value={form.lastName} onChange={(value) => update("lastName", value)} placeholder="Смирнова" icon={UserRound} />
        <AuthField label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="name@stoloto.ru" type="email" icon={Mail} invalid={form.email.length > 0 && !form.email.includes("@")} />
        <AuthField label="Телефон" value={form.phone} onChange={(value) => update("phone", value)} placeholder="+7 999 000-00-00" type="tel" icon={Phone} />
        <AuthField label="Город" value={form.city} onChange={(value) => update("city", value)} placeholder="Москва" icon={MapPin} />
        <div />
        <AuthField label="Пароль" value={form.password} onChange={(value) => update("password", value)} placeholder="Минимум 6 символов" type="password" icon={LockKeyhole} invalid={form.password.length > 0 && form.password.length < 6} />
        <AuthField label="Подтверждение" value={form.confirm} onChange={(value) => update("confirm", value)} placeholder="Повторите пароль" type="password" icon={LockKeyhole} invalid={form.confirm.length > 0 && form.confirm !== form.password} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <OptionChips label="Интересы" options={interestOptions} selected={interests} onToggle={(value) => toggle(interests, setInterests, value)} />
        <OptionChips label="Профессиональные навыки / pro bono" options={skillOptions} selected={skills} onToggle={(value) => toggle(skills, setSkills, value)} />
      </div>
      <label className="mt-5 flex gap-3 rounded-2xl bg-[#fffdf7] p-4 text-sm font-bold leading-6 text-black/62">
        <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-1 size-4 shrink-0 accent-brand" />
        Согласен с правилами платформы и обработкой данных для участия в волонтёрских активностях.
      </label>
      <button type="submit" disabled={!valid || submitting} aria-disabled={!valid} className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] ${valid && !submitting ? "bg-brand text-black" : "bg-[#efeee8] text-black/32"}`}>
        {submitting ? "Создаём профиль..." : "Создать профиль"}
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl bg-[#fff1f1] p-4 text-sm font-bold leading-6 text-[#c83c3c]" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-2xl bg-[#e8f8e8] p-4 text-sm font-bold leading-6 text-[#247a31]" aria-live="polite">
          {success}
        </p>
      ) : null}
    </form>
  );
}
