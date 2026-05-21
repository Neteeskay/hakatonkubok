"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/widgets/navigation/logo";
import {
  buildVolunteerRegisterRequest,
  getVolunteerRegistrationFieldErrors,
  isVolunteerRegistrationValid,
  volunteerOnboardingRegistrationForm
} from "@/widgets/auth/model/volunteer-registration";
import { useVolunteerRegistration } from "@/widgets/auth/model/use-volunteer-registration";

const onboardingInterests = ["дети", "спорт", "дизайн", "события"];
const onboardingSkills = ["Дизайн"];

export default function VolunteerRegisterPage() {
  const [form, setForm] = useState(volunteerOnboardingRegistrationForm);
  const [agree, setAgree] = useState(false);
  const [checked, setChecked] = useState(false);
  const { clearFeedback, error, registerVolunteer, submitting, success } = useVolunteerRegistration();
  const fieldErrors = getVolunteerRegistrationFieldErrors(form);

  const valid = useMemo(() => {
    return isVolunteerRegistrationValid({ agree, form, interests: onboardingInterests });
  }, [agree, form]);

  const fullName = `${form.firstName} ${form.lastName}`.trim();

  function update(field: keyof typeof form, value: string) {
    clearFeedback();
    setChecked(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;

    await registerVolunteer(
      buildVolunteerRegisterRequest({
        form,
        interests: onboardingInterests,
        skills: onboardingSkills
      })
    );
  }

  return (
    <AuthRegistrationShell title="Регистрация волонтёра" description="Сценарий через корпоративную почту или employee id. Данные сотрудника подтягиваются для onboarding.">
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-[1.35rem] bg-white/70 p-5">
          <OnboardingField error={fieldErrors.email} icon={Mail} invalid={Boolean(fieldErrors.email)} value={form.email} onChange={(value) => update("email", value)} type="email" />
          <OnboardingField icon={UserRound} value={form.employeeId ?? ""} onChange={(value) => update("employeeId", value)} prefix="Employee ID:" />
          <OnboardingField
            icon={LockKeyhole}
            error={fieldErrors.password}
            invalid={Boolean(fieldErrors.password)}
            onChange={(value) => update("password", value)}
            placeholder="Пароль от 6 символов"
            type="password"
            value={form.password}
          />
          <OnboardingField
            icon={LockKeyhole}
            error={fieldErrors.confirm}
            invalid={Boolean(fieldErrors.confirm)}
            onChange={(value) => update("confirm", value)}
            placeholder="Повторите пароль"
            type="password"
            value={form.confirm}
          />
          <label className="flex gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-black/62">
            <input type="checkbox" checked={agree} onChange={(event) => { clearFeedback(); setAgree(event.target.checked); }} className="mt-1 size-4 shrink-0 accent-brand" />
            <span>Согласен с правилами платформы и обработкой данных для участия в волонтёрских активностях.</span>
          </label>
          <button type="button" onClick={() => setChecked(true)} className="h-12 w-full rounded-2xl bg-brand text-sm font-black text-black">Проверить сотрудника</button>
          {checked ? (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-black/54">
              Данные сотрудника будут проверены при создании профиля.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-[#fff1f1] p-4 text-sm font-bold leading-6 text-[#c83c3c]" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-2xl bg-[#e8f8e8] p-4 text-sm font-bold leading-6 text-[#247a31]" aria-live="polite">
              {success}
            </p>
          ) : null}
        </div>
        <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
          <CheckCircle2 className="size-8 text-brand" />
          <h3 className="mt-5 text-2xl font-black text-black">{fullName}</h3>
          <p className="mt-2 text-black/62">{form.city} / {form.department} / {form.position}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {onboardingInterests.map((item) => <span key={item} className="rounded-full bg-brand/20 px-3 py-2 text-xs font-black text-black">{item}</span>)}
          </div>
          <button
            type="submit"
            disabled={!valid || submitting}
            aria-disabled={!valid || submitting}
            className={cn(
              "mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-black transition",
              (!valid || submitting) && "cursor-not-allowed opacity-55"
            )}
          >
            {submitting ? "Создаём профиль..." : "Завершить onboarding"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>
    </AuthRegistrationShell>
  );
}

function OnboardingField({
  icon: Icon,
  error,
  invalid,
  onChange,
  placeholder,
  prefix,
  type = "text",
  value
}: {
  icon: LucideIcon;
  error?: string | null;
  invalid?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <label className="block">
      <span className={cn(
        "flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-bold text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0)] transition focus-within:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.85)]",
        invalid && "shadow-[inset_0_0_0_2px_rgba(239,68,68,0.72)]"
      )}>
        <Icon className="size-4 shrink-0" />
        {prefix ? <span className="shrink-0">{prefix}</span> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-black/32"
        />
      </span>
      {error ? <span className="mt-2 block px-1 text-xs font-bold leading-5 text-[#c83c3c]">{error}</span> : null}
    </label>
  );
}

function AuthRegistrationShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fffdf7] p-5">
      <section className="mx-auto max-w-5xl py-10">
        <div className="w-56 rounded-3xl bg-white px-4 py-3 shadow-[0_16px_45px_rgba(66,50,0,0.08)]"><Logo /></div>
        <div className="premium-surface mt-8 rounded-[2rem] p-6 md:p-8">
          <h1 className="text-4xl font-black md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-black/62">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
