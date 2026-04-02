"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/context/auth-store";
import { authClient } from "@/lib/auth";

/**
 * Hydrates the Zustand auth store once on mount by calling authClient.getSession().
 * This is the single client-side HTTP call that replaces the per-navigation
 * React Query polling. On subsequent SPA navigations the store persists in memory.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res.data) {
        setSession(res.data);
      } else {
        setSession(null);
      }
    });
  }, [setSession]);

  return <>{children}</>;
}
