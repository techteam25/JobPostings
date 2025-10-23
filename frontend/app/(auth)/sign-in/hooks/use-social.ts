import { env } from "@/env";
import { authClient } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGoogleAuth = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: signInWithGoogleAsync,
    isPending: isGoogleSignInPending,
  } = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/`,
      }),

    onError: (error) => {
      toast.error(error.message || "Login unsuccessful");
    },
    onSuccess: async () => {
      toast.success("Login successful!");
      await queryClient.invalidateQueries({ queryKey: ["get-user-session"] });
    },
  });

  return { signInWithGoogleAsync, isGoogleSignInPending };
};

export const useLinkedInAuth = () => {
  const queryClient = useQueryClient();
  const {
    mutateAsync: signInWithLinkedInAsync,
    isPending: isLinkedInSignInPending,
  } = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social({
        provider: "linkedin",
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/`,
      }),

    onError: (error) => {
      toast.error(error.message || "Login unsuccessful");
    },
    onSuccess: async () => {
      toast.success("Login successful!");
      await queryClient.invalidateQueries({ queryKey: ["get-user-session"] });
    },
  });

  return { signInWithLinkedInAsync, isLinkedInSignInPending };
};
