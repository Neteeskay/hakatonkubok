import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, UserRound } from "lucide-react";
import { Logo } from "@/widgets/navigation/logo";

export default function VolunteerRegisterPage() {
  return (
    <AuthRegistrationShell title="Регистрация волонтёра" description="Mock-сценарий через корпоративную почту или employee id. Данные сотрудника подтягиваются для onboarding.">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-[1.35rem] bg-white/70 p-5">
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-bold text-black/62"><Mail className="size-4" /> anna.sokolova@stoloto.ru</label>
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-bold text-black/62"><UserRound className="size-4" /> Employee ID: ST-2048</label>
          <button className="h-12 w-full rounded-2xl bg-brand text-sm font-black text-black">Проверить сотрудника</button>
        </div>
        <div className="rounded-[1.35rem] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
          <CheckCircle2 className="size-8 text-brand" />
          <h3 className="mt-5 text-2xl font-black text-black">Анна Соколова</h3>
          <p className="mt-2 text-black/62">Москва / Цифровые сервисы / Продуктовый дизайнер</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["дети", "спорт", "дизайн", "события"].map((item) => <span key={item} className="rounded-full bg-brand/20 px-3 py-2 text-xs font-black text-black">{item}</span>)}
          </div>
          <Link href="/volunteer" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-black">Завершить onboarding <ArrowRight className="size-4" /></Link>
        </div>
      </div>
    </AuthRegistrationShell>
  );
}

function AuthRegistrationShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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
