"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUserSession } from "@/app/(main)/hooks/use-user-session";
import { authClient } from "@/lib/auth";

export function EmailVerificationBanner() {
  const { data, isPending } = useUserSession();
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const user = data?.data?.user;

  const handleResend = useCallback(async () => {
    if (!user?.email) return;

    setIsSending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/email-verified",
      });
      toast.success("Verification email sent!");
    } catch {
      toast.error("Failed to send verification email.");
    } finally {
      setIsSending(false);
    }
  }, [user?.email]);

  if (isPending || !user || user.emailVerified || dismissed) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2.5 text-amber-800">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Please verify your email address to access all features.
        </span>
        <Button
          variant="link"
          size="sm"
          onClick={handleResend}
          disabled={isSending}
          className="h-auto cursor-pointer p-0 text-sm font-semibold text-amber-900 underline"
        >
          {isSending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          Resend
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="h-auto cursor-pointer p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
