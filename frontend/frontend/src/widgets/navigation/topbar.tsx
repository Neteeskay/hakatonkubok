"use client";

import Link from "next/link";
import { Bell, LogOut, MapPin, Menu, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dropdown } from "@/shared/ui/overlays";
import { roleLabels, type AppRole } from "@/shared/config/navigation";

export function Topbar({ role }: { role: AppRole }) {
  const initials = role === "volunteer" ? "АС" : role === "foundation" ? "ФД" : "АД";
  const name = role === "volunteer" ? "Анна Соколова" : role === "foundation" ? "Фонд спорта" : "Мария, модератор";

  return (
    <header className="sticky top-0 z-30 mx-3 flex h-[86px] items-center justify-between gap-4 bg-[#fffdf7]/92 px-1 backdrop-blur-xl md:mx-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Button variant="quiet" size="icon" className="shrink-0 lg:hidden" aria-label="Открыть меню">
          <Menu className="size-5" />
        </Button>
        <div className="hidden h-12 min-w-0 max-w-[720px] flex-1 items-center gap-3 rounded-full bg-white px-5 text-[15px] text-black/50 shadow-[inset_0_0_0_1px_rgba(20,18,9,0.06),0_14px_36px_rgba(34,28,8,0.05)] md:flex">
          <span className="truncate">Поиск по заданиям, фондам и событиям</span>
          <Search className="ml-auto size-5 text-black" />
        </div>
        {role === "volunteer" ? (
          <Button className="hidden h-12 shrink-0 rounded-full px-7 md:inline-flex">
            <MapPin className="size-4" />
            Карта заданий
          </Button>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button variant="quiet" size="icon" className="relative rounded-full bg-white shadow-[0_10px_24px_rgba(34,28,8,0.06)]" aria-label="Уведомления" asChild>
          <Link href={role === "admin" ? "/admin/notifications" : role === "volunteer" ? "/volunteer/notifications" : "/foundation"}>
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-black text-black">3</span>
          </Link>
        </Button>
        <Dropdown
          label={
            <span className="flex items-center gap-3 rounded-full">
              <span className="grid size-12 place-items-center rounded-full bg-brand text-sm font-black text-black shadow-[0_14px_30px_rgba(255,227,0,0.28)]">{initials}</span>
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-sm font-black">{name}</span>
                <span className="block text-xs text-foreground/54">{roleLabels[role]}</span>
              </span>
            </span>
          }
        >
          <div className="space-y-1 text-sm">
            <Link className="block rounded-md px-3 py-2 hover:bg-surface-muted" href={role === "volunteer" ? "/volunteer/profile" : role === "foundation" ? "/foundation/profile" : "/admin"}>Профиль</Link>
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-surface-muted" href="/login"><LogOut className="size-4" />Выйти</Link>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
