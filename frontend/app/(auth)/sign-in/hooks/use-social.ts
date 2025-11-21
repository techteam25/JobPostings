import { useState } from "react";
import { toast } from "sonner";

import { getSocialAuthUrl } from "@/app/(auth)/actions/auth";

export const useSocialAuth = () => {
  const [isSocialPending, setIsSocialPending] = useState(false);
  const handleSocialAuth = async (provider: "google" | "linkedin") => {
    setIsSocialPending(true);
    try {
      const result = await getSocialAuthUrl(provider);
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error(result.error || "Failed to authenticate");
        setIsSocialPending(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setIsSocialPending(false);
    }
  };
  return { handleSocialAuth, isSocialPending };
};
