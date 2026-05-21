import type { Metadata } from "next";
import type React from "react";
import "@/shared/styles/globals.css";
import { AppProvider } from "@/shared/providers/app-provider";

export const metadata: Metadata = {
  title: "Помогать проСТО",
  description: "Корпоративная волонтёрская платформа СТОЛОТО",
  manifest: "/manifest.webmanifest",
  themeColor: "#FFE300",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ПроСТО"
  },
  icons: {
    icon: "/pwa/icon-192.png",
    apple: "/pwa/icon-192.png"
  }
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
