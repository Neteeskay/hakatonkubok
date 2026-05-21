import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/widgets/navigation/logo";

const navItems = [
  ["О платформе", "#about"],
  ["Возможности", "#features"],
  ["Истории", "#stories"],
  ["Для фондов", "#funds"],
  ["Контакты", "#contacts"]
];

export function PremiumHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white px-4 py-4 shadow-[0_12px_40px_rgba(24,20,7,0.08)] md:px-8">
      <div className="mx-auto flex h-[72px] max-w-[1150px] items-center justify-between">
        <Logo size="landing" />
        <nav className="hidden items-center gap-7 text-[14px] font-bold text-black lg:flex">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className="transition hover:text-brand">
              {label}
            </a>
          ))}
        </nav>
        <Button className="h-12 rounded-xl px-6 text-[15px]" asChild>
          <Link href="/login">
            Войти
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
