import { env } from "@/env";
import { authClient } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";

export const useGoogleAuth = () => {
  const {
    mutateAsync: signInWithGoogleAsync,
    isPending: isGoogleSignInPending,
  } = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/`,
      }),
  });

  return { signInWithGoogleAsync, isGoogleSignInPending };
};

export const useLinkedInAuth = () => {
  const {
    mutateAsync: signInWithLinkedInAsync,
    isPending: isLinkedInSignInPending,
  } = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social({
        provider: "linkedin",
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/`,
      }),
  });

  return { signInWithLinkedInAsync, isLinkedInSignInPending };
};
