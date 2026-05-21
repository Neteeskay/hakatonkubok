import { AppShell } from "@/widgets/app-shell/app-shell";

export default function FoundationLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="foundation">{children}</AppShell>;
}
