"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { interestOptions, skillOptions } from "@/widgets/auth/model/auth-data";
import { AuthField, OptionChips } from "@/widgets/auth/ui/auth-field";

export function RegisterForm() {
  const [form, setForm] = useState({
    firstName: "Анна",
    lastName: "Смирнова",
    email: "anna.smirnova@stoloto.ru",
    password: "",
    confirm: "",
    city: "Москва",
    phone: "+7 999 123-45-67"
  });
  const [interests, setInterests] = useState(["Экология", "Образование"]);
  const [skills, setSkills] = useState(["Презентации", "Дизайн"]);
  const [agree, setAgree] = useState(false);
  const valid = useMemo(() => {
    return form.firstName.length > 1 && form.lastName.length > 1 && form.email.includes("@") && form.password.length >= 6 && form.password === form.confirm && form.city.length > 1 && form.phone.length >= 7 && interests.length > 0 && agree;
  }, [form, interests, agree]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggle(list: string[], setter: (value: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <section>
      <h2 className="text-3xl font-black">Регистрация волонтёра</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Профиль помогает подбирать задания, pro bono активности и корректно учитывать часы.</p>
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
      <Link href={valid ? "/volunteer/profile" : "#"} aria-disabled={!valid} className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] ${valid ? "bg-brand text-black" : "pointer-events-none bg-[#efeee8] text-black/32"}`}>
        Создать профиль
      </Link>
    </section>
  );
}
