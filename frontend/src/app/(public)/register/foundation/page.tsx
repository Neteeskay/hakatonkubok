"use client";

import type { FormEvent, InputHTMLAttributes } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileUp, ShieldCheck } from "lucide-react";
import { fundApi } from "@/shared/api/services";
import { useAuthStore } from "@/shared/auth/auth-store";
import { Logo } from "@/widgets/navigation/logo";

export default function FoundationRegisterPage() {
  const router = useRouter();
  const registerFund = useAuthStore((state) => state.registerFund);
  const [form, setForm] = useState({
    name: "",
    description: "",
    help_categories: "children, ecology",
    inn: "",
    ogrn: "",
    region: "",
    website_url: "",
    representative_full_name: "",
    contact_position: "",
    email: "",
    password: "",
    contact_phone: "",
    planned_help: ""
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerFund({
        email: form.email,
        password: form.password,
        representative_full_name: form.representative_full_name,
        representative_phone: form.contact_phone,
        name: form.name,
        description: form.description,
        help_categories: form.help_categories.split(",").map((item) => item.trim()).filter(Boolean),
        inn: form.inn || null,
        ogrn: form.ogrn || null,
        region: form.region || null,
        website_url: form.website_url || null,
        contact_person: form.representative_full_name,
        contact_position: form.contact_position || null,
        contact_email: form.email,
        contact_phone: form.contact_phone || null,
        planned_help: form.planned_help || null
      });

      if (files?.length) {
        for (const file of Array.from(files)) {
          await fundApi.uploadDocument({ documentType: "registration_document", file });
        }
      }

      router.replace("/foundation");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf7] p-5">
      <section className="mx-auto max-w-6xl py-10">
        <div className="w-56 rounded-3xl bg-white px-4 py-3 shadow-[0_16px_45px_rgba(66,50,0,0.08)]"><Logo /></div>
        <form onSubmit={handleSubmit} className="premium-surface mt-8 rounded-[2rem] p-6 md:p-8">
          <h1 className="text-4xl font-black md:text-6xl">Регистрация фонда</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-black/62">После отправки фонд получает статус moderation pending. До одобрения нельзя публиковать задания.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <div className="grid gap-3 md:grid-cols-2">
              <Field value={form.name} onChange={(value) => update("name", value)} placeholder="Название фонда" required />
              <Field value={form.description} onChange={(value) => update("description", value)} placeholder="Описание" />
              <Field value={form.help_categories} onChange={(value) => update("help_categories", value)} placeholder="Категории помощи" />
              <Field value={form.inn} onChange={(value) => update("inn", value)} placeholder="ИНН" />
              <Field value={form.ogrn} onChange={(value) => update("ogrn", value)} placeholder="ОГРН" />
              <Field value={form.region} onChange={(value) => update("region", value)} placeholder="Регион" />
              <Field value={form.website_url} onChange={(value) => update("website_url", value)} placeholder="Сайт" />
              <Field value={form.representative_full_name} onChange={(value) => update("representative_full_name", value)} placeholder="Контактное лицо" required />
              <Field value={form.contact_position} onChange={(value) => update("contact_position", value)} placeholder="Должность" />
              <Field value={form.email} onChange={(value) => update("email", value)} placeholder="Email" type="email" required />
              <Field value={form.password} onChange={(value) => update("password", value)} placeholder="Пароль минимум 8 символов" type="password" required />
              <Field value={form.contact_phone} onChange={(value) => update("contact_phone", value)} placeholder="Телефон" />
              <Field value={form.planned_help} onChange={(value) => update("planned_help", value)} placeholder="Какие активности будете публиковать" />
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.35rem] bg-white/70 p-5">
                <FileUp className="size-8" />
                <h3 className="mt-4 text-xl font-black">Документы фонда</h3>
                <p className="mt-2 text-sm leading-6 text-black/58">Устав, выписка, доверенность контактного лица.</p>
                <input type="file" multiple onChange={(event) => setFiles(event.target.files)} className="mt-5 w-full rounded-2xl bg-brand/40 p-4 text-sm font-black" />
              </div>
              <div className="rounded-[1.35rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
                <ShieldCheck className="size-8 text-brand" />
                <h3 className="mt-4 text-xl font-black text-black">STATUS: moderation pending</h3>
                <p className="mt-2 text-sm leading-6 text-black/62">Публикация заданий будет доступна после проверки администратора.</p>
              </div>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
              <button disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black text-black disabled:opacity-50">Отправить заявку <ArrowRight className="size-4" /></button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

type FieldProps = { value: string; onChange: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

function Field({ value, onChange, ...props }: FieldProps) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} className="h-14 rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black/58 outline-none" {...props} />;
}
