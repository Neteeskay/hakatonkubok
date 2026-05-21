import { Sidebar } from "@/widgets/navigation/sidebar";
import { Topbar } from "@/widgets/navigation/topbar";
import { MobileNav } from "@/widgets/navigation/mobile-nav";
import type { AppRole } from "@/shared/config/navigation";

export function AppShell({ children, role }: { children: React.ReactNode; role: AppRole }) {
  return (
    <div className="min-h-screen bg-[#fffdf7] lg:flex">
      <Sidebar role={role} />
      <div className="min-w-0 flex-1">
        <Topbar role={role} />
        <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 md:px-6 lg:pb-8">{children}</main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
