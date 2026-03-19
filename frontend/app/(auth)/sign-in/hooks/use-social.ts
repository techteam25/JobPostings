import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth";
import { env } from "@/env";

type SocialProviderOptions = "google" | "linkedin";

export const useSocialAuth = () => {
  const [isSocialPending, setIsSocialPending] = useState(false);

  const handleSocialAuth = async (provider: SocialProviderOptions) => {
    setIsSocialPending(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: `${env.NEXT_PUBLIC_FRONTEND_URL}/`,
      });
    } catch {
      toast.error("An unexpected error occurred");
      setIsSocialPending(false);
    }
  };

  return { handleSocialAuth, isSocialPending };
};
