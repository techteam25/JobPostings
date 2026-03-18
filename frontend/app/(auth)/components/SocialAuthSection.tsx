"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleIcon, LinkedInIcon } from "@/components/common/icons";

interface SocialAuthSectionProps {
  handleSocialAuth: (provider: "google" | "linkedin") => Promise<void>;
  isSocialPending: boolean;
  mode: "login" | "register";
}

export function SocialAuthSection({
  handleSocialAuth,
  isSocialPending,
  mode,
}: SocialAuthSectionProps) {
  return (
    <>
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="bg-background text-muted-foreground px-4">
            {mode === "register" ? "Or sign up with" : "Or continue with"}
          </span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          disabled={isSocialPending}
          variant="ghost"
          type="button"
          className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
          onClick={() => handleSocialAuth("google")}
        >
          <GoogleIcon className="size-6" />
          Google
        </Button>
        <Button
          disabled={isSocialPending}
          variant="ghost"
          type="button"
          className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
          onClick={() => handleSocialAuth("linkedin")}
        >
          <LinkedInIcon className="size-6" />
          LinkedIn
        </Button>
      </div>

      {/* Auth Link */}
      <p className="text-secondary-foreground mt-6 text-center text-xs sm:text-sm">
        {mode === "register" ? (
          <>
            Already have an account?{" "}
            <Button
              asChild
              variant="link"
              className="text-accent hover:text-accent/90 cursor-pointer text-xs font-semibold sm:text-sm"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Button
              asChild
              variant="link"
              className="text-accent hover:text-accent/90 cursor-pointer font-semibold"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </>
        )}
      </p>
    </>
  );
}
