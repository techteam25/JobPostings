"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
