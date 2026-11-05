"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";

import {
  forgotPasswordSchema,
  type ForgotPasswordData,
} from "@/schemas/auth/forgot-password";
import { authClient } from "@/lib/auth";
import { env } from "@/env";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";

import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

const defaultValues: ForgotPasswordData = {
  email: "",
};

export default function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues,
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async (values) => {
      startTransition(async () => {
        try {
          await authClient.requestPasswordReset({
            email: values.value.email,
            redirectTo: `${env.NEXT_PUBLIC_FRONTEND_URL}/reset-password`,
          });

          setIsSubmitted(true);
        } catch {
          toast.error("An unexpected error occurred");
        }
      });
    },
  });

  if (isSubmitted) {
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
            <div className="bg-accent/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Mail className="text-accent h-6 w-6" />
            </div>
            <h2 className="text-foreground text-xl font-bold">
              Check your email
            </h2>
            <p className="text-muted-foreground text-sm">
              If an account exists with that email, we&apos;ve sent a password
              reset link. Please check your inbox.
            </p>
            <Button asChild variant="link" className="text-accent-foreground">
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
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
          <div className="text-center">
            <h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl/9">
              Forgot your password?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>
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
            <form.Field
              name="email"
              children={(field) => (
                <div>
                  <Label
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
                  >
                    Email Address
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    type="email"
                    placeholder="john.doe@example.com"
                    className="border-border focus-visible:ring-accent w-full rounded-lg border px-4 py-3 transition outline-none focus-visible:border-transparent focus-visible:ring-2"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition"
                >
                  {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              )}
            />
          </form>

          <p className="mt-6 text-center">
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
