"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;

    setIsSending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/email-verified",
      });
      toast.success("Verification email sent!");
      setCooldown(60);
    } catch {
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [email, cooldown]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-accent/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-accent h-8 w-8" />
        </div>

        <h1 className="text-foreground mb-2 text-2xl font-bold">
          Check your email
        </h1>

        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <span className="text-foreground font-medium">{email}</span>
          ) : (
            "your email address"
          )}
          . Please check your inbox and click the link to verify your account.
        </p>

        <Button
          onClick={handleResend}
          disabled={cooldown > 0 || isSending || !email}
          className="bg-accent hover:bg-accent/90 text-accent-foreground mb-4 w-full cursor-pointer"
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend verification email"}
        </Button>

        <Button asChild variant="ghost" className="w-full cursor-pointer">
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
