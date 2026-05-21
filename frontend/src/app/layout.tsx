import type { Metadata } from "next";
import "@/shared/styles/globals.css";
import { AppProvider } from "@/shared/providers/app-provider";

export const metadata: Metadata = {
  title: "Столото Волонтёры",
  description: "Корпоративная волонтёрская платформа Столото"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
