import { useAuthStore } from "@/context/auth-store";

/**
 * Thin wrapper over the Zustand auth store.
 * Maintains the same API shape as the old React Query hook so
 * existing consumers (Navbar, EmployerNavbar, EmailPreferences, etc.)
 * don't need changes.
 */
export const useUserSession = () => {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  return {
    // Matches the old shape: data?.data?.user, data?.data?.session
    data: session ? { data: session } : null,
    error: null,
    isPending: isLoading,
  };
};
