import Link from "next/link";
import { ArrowRight, FileUp, ShieldCheck } from "lucide-react";
import { Logo } from "@/widgets/navigation/logo";

const fields = ["Название фонда", "Описание", "Категории помощи", "ИНН / ОГРН", "Регион", "Сайт", "Соцсети", "Контактное лицо", "Должность", "Email", "Телефон", "Какие активности будете публиковать"];

export default function FoundationRegisterPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7] p-5">
      <section className="mx-auto max-w-6xl py-10">
        <div className="w-56 rounded-3xl bg-white px-4 py-3 shadow-[0_16px_45px_rgba(66,50,0,0.08)]"><Logo /></div>
        <div className="premium-surface mt-8 rounded-[2rem] p-6 md:p-8">
          <h1 className="text-4xl font-black md:text-6xl">Регистрация фонда</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-black/62">После отправки фонд получает статус moderation pending. До одобрения нельзя публиковать задания.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => <label key={field} className="h-14 rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black/58">{field}</label>)}
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.35rem] bg-white/70 p-5">
                <FileUp className="size-8" />
                <h3 className="mt-4 text-xl font-black">Документы фонда</h3>
                <p className="mt-2 text-sm leading-6 text-black/58">Drag & drop: устав, выписка, доверенность контактного лица.</p>
                <div className="mt-5 rounded-2xl bg-brand/40 p-4 text-sm font-black">uploaded: charter.pdf, ogrn.pdf</div>
              </div>
              <div className="rounded-[1.35rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
                <ShieldCheck className="size-8 text-[#d8ae00]" />
                <h3 className="mt-4 text-xl font-black text-black">STATUS: moderation pending</h3>
                <p className="mt-2 text-sm leading-6 text-black/62">Публикация заданий будет доступна после проверки администратора.</p>
              </div>
              <Link href="/foundation" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black text-black">Отправить заявку <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
