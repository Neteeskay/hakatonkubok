"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { roleLabels, roleNavigation, type AppRole } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/widgets/navigation/logo";

export function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const navigation = roleNavigation[role];

  return (
    <aside className="hidden w-[260px] shrink-0 p-5 lg:block">
      <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col rounded-[1.55rem] bg-white p-4 shadow-[0_24px_70px_rgba(34,28,8,0.08)]">
        <div className="px-1 py-1">
          <Logo />
        </div>
        <nav className="mt-8 space-y-2" aria-label="Основная навигация">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] font-bold text-black/72 transition hover:bg-[#fff8d7] hover:text-black",
                  active && "bg-brand text-black shadow-[0_14px_30px_rgba(255,204,0,0.28)]"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                {"badge" in item && item.badge ? <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-black", active ? "bg-black/10 text-black" : "bg-brand text-black")}>{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3 pb-2">
          <p className="text-xs text-black/42">Платформа от</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-black">столото</p>
          <p className="mt-3 text-xs leading-5 text-black/44">{roleLabels[role]}</p>
        </div>
      </div>
    </aside>
  );
}
