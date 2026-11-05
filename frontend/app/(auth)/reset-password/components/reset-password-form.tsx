"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

import {
  resetPasswordSchema,
  type ResetPasswordData,
} from "@/schemas/auth/reset-password";
import { authClient } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldInfo } from "@/components/common/FieldInfo";
import { PasswordStrengthIndicator } from "@/components/common/password-strength-indicator";

import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

const defaultValues: ResetPasswordData = {
  newPassword: "",
  confirmNewPassword: "",
};

export default function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const form = useForm({
    defaultValues,
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async (values) => {
      if (!token) return;

      startTransition(async () => {
        try {
          const { error: resetError } = await authClient.resetPassword({
            newPassword: values.value.newPassword,
            token,
          });

          if (resetError) {
            toast.error(resetError.message || "Failed to reset password");
            return;
          }

          toast.success("Password reset successfully");
          router.replace("/sign-in");
        } catch {
          toast.error("An unexpected error occurred");
        }
      });
    },
  });

  // Error state — invalid or expired token
  if (error || !token) {
    return (
      <div className="bg-background flex w-full max-w-lg items-center justify-center rounded-2xl px-4 py-12 shadow-md md:px-6 lg:px-8">
        <div className="w-full sm:mx-auto sm:max-w-sm md:max-w-lg">
          <div className="mb-10 space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
            <Image
              src={GetInvolvedLogo}
              alt="Get Involved Logo"
              className="mx-auto h-16 w-auto md:h-20"
            />
          </div>
          <div className="space-y-4 text-center">
            <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <h2 className="text-foreground text-xl font-bold">
              This link has expired or is invalid
            </h2>
            <p className="text-muted-foreground text-sm">
              Password reset links are valid for 30 minutes. Please request a
              new one.
            </p>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
            <p>
              <Button asChild variant="link" className="text-muted-foreground">
                <Link href="/sign-in">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex w-full max-w-lg items-center justify-center rounded-2xl px-4 py-12 shadow-md md:px-6 lg:px-8">
      <div className="w-full sm:mx-auto sm:max-w-sm md:max-w-lg">
        <div className="mb-10 space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            src={GetInvolvedLogo}
            alt="Get Involved Logo"
            className="mx-auto h-16 w-auto md:h-20"
          />
          <h2 className="text-foreground text-center text-xl font-bold tracking-tight md:text-2xl/9">
            Reset your password
          </h2>
        </div>
        <div className="mt-3 sm:mx-auto sm:w-full sm:max-w-sm md:max-w-lg">
          <form
            className="flex w-full flex-col space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await form.handleSubmit();
            }}
          >
            {/* New Password */}
            <form.Field
              name="newPassword"
              children={(field) => (
                <Field>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
                  >
                    New Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
                    />
                    <Button
                      size="icon"
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5"
                    >
                      {showNewPassword ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator password={field.state.value} />
                  <FieldInfo field={field} />
                </Field>
              )}
            />

            {/* Confirm New Password */}
            <form.Field
              name="confirmNewPassword"
              children={(field) => (
                <Field>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
                  >
                    Confirm New Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
                    />
                    <Button
                      size="icon"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5"
                    >
                      {showConfirmPassword ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                  <FieldInfo field={field} />
                </Field>
              )}
            />

            {/* Submit Button */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className={cn(
                    "bg-primary hover:bg-primary/90 text-primary-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition",
                    {
                      "cursor-not-allowed opacity-50":
                        !canSubmit || isSubmitting || isPending,
                    },
                  )}
                >
                  {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              )}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
