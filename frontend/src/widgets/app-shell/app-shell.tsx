"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authService, fundsService, notificationsService, NOTIFICATIONS_CHANGED_EVENT } from "@/shared/api";
import { resolveApiFileUrl } from "@/shared/api/config";
import { Sidebar } from "@/widgets/navigation/sidebar";
import { Topbar } from "@/widgets/navigation/topbar";
import { MobileNav } from "@/widgets/navigation/mobile-nav";
import type { AppRole } from "@/shared/config/navigation";

export function AppShell({ children, role }: { children: ReactNode; role: AppRole }) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadShellData = useCallback(async () => {
    try {
      const [user, unread] = await Promise.all([
        authService.getCurrentUser(),
        notificationsService.getRoleNotifications(role, { unreadOnly: true, limit: 100, offset: 0 })
      ]);

      if (role === "foundation") {
        const fund = await fundsService.getMyFundProfile().catch(() => null);
        setDisplayName(fund?.name || user.full_name || user.email);
        setAvatarUrl(resolveApiFileUrl(fund?.logo_url ?? user.avatar_url));
      } else {
        setDisplayName(user.full_name || user.username || user.email);
        setAvatarUrl(resolveApiFileUrl(user.avatar_url));
      }

      setUnreadNotifications(unread.length);
    } catch {
      setDisplayName(null);
      setAvatarUrl(null);
      setUnreadNotifications(0);
    }
  }, [role]);

  useEffect(() => {
    void loadShellData();
    const interval = window.setInterval(() => {
      void loadShellData();
    }, 30000);
    const refresh = () => {
      void loadShellData();
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [loadShellData]);

  return (
    <div className="min-h-screen bg-[#fffdf7] lg:flex">
      <Sidebar role={role} unreadNotifications={unreadNotifications} />
      <div className="min-w-0 flex-1">
        <Topbar role={role} displayName={displayName} avatarUrl={avatarUrl} unreadNotifications={unreadNotifications} />
        <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 md:px-6 lg:pb-8">{children}</main>
      </div>
      <MobileNav role={role} unreadNotifications={unreadNotifications} />
    </div>
  );
}
