import { Mail, MessageCircle, Phone, Send, Smartphone, type LucideIcon } from "lucide-react";
import type { VolunteerApplicationItem } from "@/widgets/volunteer-activity/activity-data";

export function ApplicationContactPanel({ application }: { application: VolunteerApplicationItem }) {
  if (!application.contactUnlocked || !application.contact) {
    return (
      <div className="rounded-[1.15rem] bg-[#f8f7f2] p-4">
        <p className="text-sm font-black">Контакты откроются после принятия</p>
        <p className="mt-2 text-sm font-medium leading-6 text-black/54">Когда фонд примет отклик, здесь появятся телефон, email, мессенджер, чат и рабочая инструкция.</p>
      </div>
    );
  }

  const contact = application.contact;

  return (
    <div className="rounded-[1.15rem] bg-brand/12 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black">Связь с фондом доступна</p>
          <p className="mt-1 text-xs font-bold text-black/48">{contact.name}, {contact.role}</p>
        </div>
        <span className="rounded-full bg-brand px-3 py-1 text-xs font-black text-black">принят</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ContactAction icon={Send} label="Telegram" value={contact.telegram} />
        <ContactAction icon={Smartphone} label="WhatsApp" value={contact.whatsapp} />
        <ContactAction icon={Phone} label="Позвонить" value={contact.phone} />
        <ContactAction icon={Mail} label="Email" value={contact.email} />
      </div>
      <div className="mt-3 rounded-[1rem] bg-white/72 p-3">
        <p className="flex items-center gap-2 text-sm font-black"><MessageCircle className="size-4" />{contact.chat}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-black/56">{contact.instruction}</p>
      </div>
    </div>
  );
}

function ContactAction({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <button className="flex min-w-0 items-center gap-3 rounded-xl bg-white/82 p-3 text-left shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] transition hover:-translate-y-0.5 hover:bg-white">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-black">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.1em] text-black/36">{label}</span>
        <span className="block truncate text-sm font-black text-black/68">{value}</span>
      </span>
    </button>
  );
}
