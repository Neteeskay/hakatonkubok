"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { routeForRole, useAuthStore } from "@/shared/auth/auth-store";
import { AuthField } from "@/widgets/auth/ui/auth-field";

export function LoginForm({ onRecovery }: { onRecovery: () => void }) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const authError = useAuthStore((state) => state.error);
  const authStatus = useAuthStore((state) => state.status);
  const [email, setEmail] = useState("volunteer@stoloto.local");
  const [password, setPassword] = useState("password123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const valid = useMemo(() => email.trim().length > 0 && password.length >= 6, [email, password]);
  const loading = authStatus === "loading";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || loading) return;

    try {
      setError(null);
      const user = await login({ login: email, password });
      router.replace(routeForRole(user.role));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось войти");
    }
  }

  return (
    <section>
      <h2 className="text-3xl font-black">Вход в платформу</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">Войдите по корпоративной почте или используйте demo role для презентации.</p>
      <form onSubmit={handleSubmit}>
        <div className="mt-5 space-y-4">
          <AuthField label="Email" value={email} onChange={setEmail} placeholder="name@stoloto.ru" type="email" icon={Mail} invalid={email.length > 0 && !email.includes("@") && email !== "admin"} />
          <AuthField label="Пароль" value={password} onChange={setPassword} placeholder="Введите пароль" type="password" icon={LockKeyhole} invalid={password.length > 0 && password.length < 6} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-black/62">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-brand" />
            Запомнить меня
          </label>
          <button type="button" onClick={onRecovery} className="text-sm font-black text-black transition hover:text-brand">Забыли пароль?</button>
        </div>
        {error || authError ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error ?? authError}</p> : null}
        <button
          type="submit"
          disabled={!valid || loading}
          className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] ${valid && !loading ? "bg-brand text-black" : "pointer-events-none bg-[#efeee8] text-black/32"}`}
        >
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </section>
  );
}
