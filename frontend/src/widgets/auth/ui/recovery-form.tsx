"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { AuthField } from "@/widgets/auth/ui/auth-field";

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const valid = useMemo(() => email.includes("@"), [email]);

  return (
    <section>
      <h2 className="text-3xl font-black">Восстановление доступа</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Отправим ссылку для входа на корпоративную почту.</p>
      <div className="mt-6">
        <AuthField label="Email" value={email} onChange={(value) => { setEmail(value); setSent(false); }} placeholder="corporate@email.ru" type="email" icon={Mail} invalid={email.length > 0 && !valid} />
      </div>
      <button disabled={!valid} onClick={() => setSent(true)} className="mt-4 h-12 w-full rounded-2xl bg-brand text-sm font-black text-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] disabled:bg-[#efeee8] disabled:text-black/32 disabled:shadow-none">
        Отправить ссылку
      </button>
      <p className={`mt-4 rounded-2xl p-4 text-sm font-bold leading-6 ${sent ? "bg-[#e8f8e8] text-[#247a31]" : "bg-brand/12 text-black/62"}`}>
        {sent ? "Ссылка отправлена. Проверьте почту и вернитесь в свой ролевой кабинет." : "После восстановления пользователь возвращается в кабинет волонтёра, фонда или администратора."}
      </p>
    </section>
  );
}
