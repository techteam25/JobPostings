import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth";
import { env } from "@/env";

type SocialProviderOptions = "google" | "linkedin";
type SignUpIntent = "seeker" | "employer";

export const useSocialAuth = () => {
  const [isSocialPending, setIsSocialPending] = useState(false);

  const handleSocialAuth = async (
    provider: SocialProviderOptions,
    signUpIntent?: SignUpIntent,
  ) => {
    setIsSocialPending(true);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        // Better Auth redirects here after the provider callback; /post-login
        // then routes by intent + onboardingStatus (same as email redirectUrl).
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/post-login`,
        errorCallbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/sign-in`,
        newUserCallbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/post-login`,
        ...(signUpIntent && { additionalData: { intent: signUpIntent } }),
      });
      if (error) {
        toast.error(error.message || "Unable to continue with this provider");
        setIsSocialPending(false);
      }
    } catch {
      toast.error("Unable to continue with this provider. Please try again.");
      setIsSocialPending(false);
    }
  };

  return { handleSocialAuth, isSocialPending };
};
