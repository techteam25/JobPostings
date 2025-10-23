import { redirect, RedirectType } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import { authClient } from "@/lib/auth";

export const useUserSignOut = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: signOutAsyncAction, isPending } = useMutation({
    mutationFn: async () =>
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["get-user-session"] });
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
