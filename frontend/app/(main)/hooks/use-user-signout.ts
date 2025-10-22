import { redirect, RedirectType } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";

import { authClient } from "@/lib/auth";

export const useUserSignOut = () => {
  const { mutateAsync: signOutAsyncAction, isPending } = useMutation({
    mutationFn: async () =>
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            redirect("/sign-in", RedirectType.replace);
          },
          onError: () => {
            toast.error("Sign out unsuccessful");
          },
        },
      }),
  });

  return { signOutAsyncAction, isPending };
};
