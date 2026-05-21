"use client";

import * as React from "react";
import { QueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { PwaProvider } from "@/shared/providers/pwa-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PwaProvider />
        {children}
      </QueryProvider>
    </ThemeProvider>
  );
}