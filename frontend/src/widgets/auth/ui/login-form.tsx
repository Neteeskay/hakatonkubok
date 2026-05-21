"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";
import {
  isLoginIdentifierValid,
  isLoginPasswordValid,
} from "@/shared/auth/login-validation";
import { AuthField } from "@/widgets/auth/ui/auth-field";

export function LoginForm({ onRecovery }: { onRecovery: () => void }) {
  const [login, setLogin] = useState("anna.smirnova@stoloto.ru");
  const [password, setPassword] = useState("volunteer-demo");
  const [remember, setRemember] = useState(true);

  const valid = useMemo(
    () => isLoginIdentifierValid(login) && isLoginPasswordValid(login, password),
    [login, password],
  );

  const loginInvalid = login.length > 0 && !isLoginIdentifierValid(login);
  const passwordInvalid = password.length > 0 && !isLoginPasswordValid(login, password);

  return (
    <section>
      <h2 className="text-3xl font-black">Вход в платформу</h2>
      <p className="mt-2 text-sm leading-6 text-black/56">
        Войдите по корпоративной почте или логину. Для demo-админа: admin / admin.
      </p>
      <div className="mt-5 space-y-4">
        <AuthField
          label="Email или логин"
          value={login}
          onChange={setLogin}
          placeholder="name@stoloto.ru или admin"
          type="text"
          icon={Mail}
          invalid={loginInvalid}
        />
        <AuthField
          label="Пароль"
          value={password}
          onChange={setPassword}
          placeholder="Введите пароль"
          type="password"
          icon={LockKeyhole}
          invalid={passwordInvalid}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-bold text-black/62">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 accent-brand"
          />
          Запомнить меня
        </label>
        <button
          onClick={onRecovery}
          className="text-sm font-black text-black transition hover:text-brand"
        >
          Забыли пароль?
        </button>
      </div>
      <Link
        href={valid ? "/volunteer" : "#"}
        aria-disabled={!valid}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] ${valid ? "bg-brand text-black" : "pointer-events-none bg-[#efeee8] text-black/32"}`}
      >
        Войти
      </Link>
    </section>
  );
}
