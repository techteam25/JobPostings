import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";

import { authClient } from "@/lib/auth";
import { useAuthStore } from "@/context/auth-store";

export const useUserSignOut = () => {
  const clearSession = useAuthStore((s) => s.clearSession);
  const { mutateAsync: signOutAsyncAction, isPending } = useMutation({
    mutationFn: async () => {
      await authClient.signOut({
        fetchOptions: {
          onError: () => {
            toast.error("Sign out unsuccessful");
          },
        },
      });
      clearSession();
      toast.success("Signed out successfully");
      window.location.href = "/sign-in";
    },
  });

  return { signOutAsyncAction, isPending };
};
