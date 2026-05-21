"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/shared/auth/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const syncFromStorage = useAuthStore((state) => state.syncFromStorage);

  useEffect(() => {
    void hydrate();

    function handleStorageChange() {
      syncFromStorage();
    }

    window.addEventListener("auth-session-changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("auth-session-changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [hydrate, syncFromStorage]);

  return children;
}
