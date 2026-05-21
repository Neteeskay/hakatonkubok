"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Mail, UserRound } from "lucide-react";
import { useAuthStore } from "@/shared/auth/auth-store";
import { Logo } from "@/widgets/navigation/logo";

export default function VolunteerRegisterPage() {
  const router = useRouter();
  const registerVolunteer = useAuthStore((state) => state.registerVolunteer);
  const [form, setForm] = useState({
    email: "volunteer@stoloto.local",
    employee_id: "EMP-1001",
    password: "password123",
    full_name: "",
    city: "",
    department: "",
    position: ""
  });
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
      await registerVolunteer({
        email: form.email,
        password: form.password,
        employee_id: form.employee_id || null,
        full_name: form.full_name || null,
        city: form.city || null,
        department: form.department || null,
        position: form.position || null
      });
      router.replace("/volunteer");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось завершить регистрацию");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthRegistrationShell title="Регистрация волонтера" description="Регистрация через корпоративную почту или employee id. Данные сотрудника подтягиваются из backend для onboarding.">
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-[1.35rem] bg-white/70 p-5">
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-bold text-black/62"><Mail className="size-4" /><input value={form.email} onChange={(event) => update("email", event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" /></label>
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-bold text-black/62"><UserRound className="size-4" /><input value={form.employee_id} onChange={(event) => update("employee_id", event.target.value)} placeholder="Employee ID" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
          <input value={form.password} onChange={(event) => update("password", event.target.value)} type="password" placeholder="Пароль" className="h-14 w-full rounded-2xl bg-white px-4 text-sm font-bold text-black/62 outline-none" />
          <input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="ФИО" className="h-14 w-full rounded-2xl bg-white px-4 text-sm font-bold text-black/62 outline-none" />
          <input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Город" className="h-14 w-full rounded-2xl bg-white px-4 text-sm font-bold text-black/62 outline-none" />
          <button disabled={loading} className="h-12 w-full rounded-2xl bg-brand text-sm font-black text-black disabled:opacity-50">Проверить сотрудника</button>
          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
        </div>
        <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
          <CheckCircle2 className="size-8 text-brand" />
          <h3 className="mt-5 text-2xl font-black text-black">{form.full_name || "Профиль сотрудника"}</h3>
          <p className="mt-2 text-black/62">{form.city || "Город"} / {form.department || "Департамент"} / {form.position || "Должность"}</p>
          <button disabled={loading} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-black disabled:opacity-50">Завершить onboarding <ArrowRight className="size-4" /></button>
        </div>
      </form>
    </AuthRegistrationShell>
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
