"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { roleNavigation, type AppRole } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";

export function MobileNav({ role, unreadNotifications }: { role: AppRole; unreadNotifications: number }) {
  const pathname = usePathname();
  const navigation = roleNavigation[role].slice(0, 5);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.25rem] bg-surface/94 p-1 shadow-panel backdrop-blur lg:hidden">
      {navigation.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={cn("relative grid h-12 place-items-center rounded-lg text-foreground/52", active && "bg-brand-soft text-foreground")}>
            <item.icon className="size-5" />
            {item.href.endsWith("/notifications") && unreadNotifications > 0 ? (
              <span className="absolute right-3 top-2 size-2 rounded-full bg-brand" />
            ) : null}
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
