"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/widgets/navigation/sidebar";
import { Topbar } from "@/widgets/navigation/topbar";
import { MobileNav } from "@/widgets/navigation/mobile-nav";
import type { AppRole } from "@/shared/config/navigation";
import { useAuthStore } from "@/shared/auth/auth-store";

const requiredBackendRole: Record<AppRole, "volunteer" | "fund" | "admin"> = {
  volunteer: "volunteer",
  foundation: "fund",
  admin: "admin"
};

export function AppShell({ children, role }: { children: React.ReactNode; role: AppRole }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && user?.role !== requiredBackendRole[role]) {
      router.replace("/login");
    }
  }, [role, router, status, user?.role]);

  const allowed = status === "authenticated" && user?.role === requiredBackendRole[role];

  return (
    <div className="min-h-screen bg-[#fffdf7] lg:flex">
      <Sidebar role={role} />
      <div className="min-w-0 flex-1">
        <Topbar role={role} />
        <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 md:px-6 lg:pb-8">{allowed ? children : null}</main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
