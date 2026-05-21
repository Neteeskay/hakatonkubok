"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { roleLabels, roleNavigation, type AppRole } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/widgets/navigation/logo";

export function Sidebar({ role, unreadNotifications }: { role: AppRole; unreadNotifications: number }) {
  const pathname = usePathname();
  const navigation = roleNavigation[role];
  const activeHref = navigation
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden min-h-screen w-[260px] shrink-0 bg-white px-5 py-5 lg:block">
      <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col bg-white">
        <div className="px-1 py-1">
          <Logo />
        </div>
        <nav className="mt-8 space-y-2" aria-label="Основная навигация">
          {navigation.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] font-bold text-black/72 transition hover:bg-brand/12 hover:text-black",
                  active && "bg-brand text-black shadow-[0_12px_24px_rgba(255,227,0,0.22)]"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                {item.href.endsWith("/notifications") && unreadNotifications > 0 ? (
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-black", active ? "bg-black/10 text-black" : "bg-brand text-black")}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3 pb-2">
          <p className="text-xs font-bold text-black/38">Платформа от</p>
          <Image src="/stoloto.png" alt="Столото" width={150} height={42} className="mt-3 h-auto w-[124px] object-contain" />
          <p className="mt-3 text-xs leading-5 text-black/44">{roleLabels[role]}</p>
        </div>
      </div>
    </aside>
  );
}
