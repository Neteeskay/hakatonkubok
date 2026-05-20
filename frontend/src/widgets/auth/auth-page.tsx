"use client";

import { useState } from "react";
import { AuthBrandPanel } from "@/widgets/auth/ui/auth-brand-panel";
import { DemoLogin } from "@/widgets/auth/ui/demo-login";
import { LoginForm } from "@/widgets/auth/ui/login-form";
import { RegisterForm } from "@/widgets/auth/ui/register-form";
import { RecoveryForm } from "@/widgets/auth/ui/recovery-form";
import type { AuthMode } from "@/widgets/auth/model/auth-types";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <main className="min-h-screen bg-[#fffdf7] p-4 md:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1240px] gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <AuthBrandPanel mode={mode} onModeChange={setMode} />

        <div className="flex min-h-full flex-col gap-5">
          <section className="rounded-[2rem] bg-white p-5 shadow-[0_26px_90px_rgba(34,28,8,0.1),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-7">
            {mode === "login" ? <LoginForm onRecovery={() => setMode("recovery")} /> : null}
            {mode === "register" ? <RegisterForm /> : null}
            {mode === "recovery" ? <RecoveryForm /> : null}
          </section>
          <DemoLogin />
        </div>
      </section>
    </main>
  );
}
