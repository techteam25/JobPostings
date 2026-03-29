import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import { authClient } from "@/lib/auth";

export const useUserSignOut = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: signOutAsyncAction, isPending } = useMutation({
    mutationFn: async () => {
      await authClient.signOut({
        fetchOptions: {
          onError: () => {
            toast.error("Sign out unsuccessful");
          },
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["get-user-session"] });
      toast.success("Signed out successfully");
      router.refresh();
      router.replace("/sign-in");
    },
  });

  return { signOutAsyncAction, isPending };
};
