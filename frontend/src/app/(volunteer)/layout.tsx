import { AppShell } from "@/widgets/app-shell/app-shell";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="volunteer">{children}</AppShell>;
}
