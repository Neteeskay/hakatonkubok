"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { ApiError, authService, getApiErrorMessage, type UserRole } from "@/shared/api";
import {
  isLoginIdentifierValid,
  isLoginPasswordValid,
} from "@/shared/auth/login-validation";
import { AuthField } from "@/widgets/auth/ui/auth-field";

const roleRedirects: Record<UserRole, string> = {
  admin: "/admin",
  fund: "/foundation",
  volunteer: "/volunteer"
};

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return "Неверный логин или пароль.";
  }

  return getApiErrorMessage(error);
}

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("volunteer@stoloto.local");
  const [password, setPassword] = useState("password123");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const valid = useMemo(
    () => isLoginIdentifierValid(login) && isLoginPasswordValid(login, password),
    [login, password],
  );

  const loginInvalid = login.length > 0 && !isLoginIdentifierValid(login);
  const passwordInvalid = password.length > 0 && !isLoginPasswordValid(login, password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.login({ login: login.trim(), password });
      setSuccess("Вход выполнен. Открываем кабинет.");
      router.push(roleRedirects[response.user.role]);
    } catch (submitError) {
      setError(getLoginErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
      </div>
      <button
        type="submit"
        disabled={!valid || submitting}
        aria-disabled={!valid}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_rgba(255,227,0,0.28)] ${valid && !submitting ? "bg-brand text-black" : "bg-[#efeee8] text-black/32"}`}
      >
        {submitting ? "Входим..." : "Войти"}
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl bg-[#fff1f1] p-4 text-sm font-bold leading-6 text-[#c83c3c]" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-2xl bg-[#e8f8e8] p-4 text-sm font-bold leading-6 text-[#247a31]" aria-live="polite">
          {success}
        </p>
      ) : null}
    </form>
  );
}
