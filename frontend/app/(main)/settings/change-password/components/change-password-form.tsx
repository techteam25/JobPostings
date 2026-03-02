"use client";

import { useState, useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

import {
  changePasswordSchema,
  type ChangePasswordData,
} from "@/schemas/auth/change-password";
import { authClient } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";

import { BsEye, BsEyeSlash } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const defaultValues: ChangePasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const PASSWORD_REQUIREMENTS = [
  { label: "Minimum 8 characters", test: (pw: string) => pw.length >= 8 },
  {
    label: "One uppercase character",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "One lowercase character",
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    label: "One special character",
    test: (pw: string) => /[@$!%*?&]/.test(pw),
  },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
] as const;

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-muted-foreground text-xs font-medium">
        Please add all necessary characters to create a safe password.
      </p>
      <ul className="space-y-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  met ? "bg-accent" : "bg-destructive",
                )}
              />
              <span
                className={cn(
                  met ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues,
    validators: {
      onChange: changePasswordSchema,
    },
    onSubmit: async (values) => {
      startTransition(async () => {
        try {
          const { error } = await authClient.changePassword({
            currentPassword: values.value.currentPassword,
            newPassword: values.value.newPassword,
            revokeOtherSessions: true,
          });

          if (error) {
            toast.error(error.message || "Failed to change password");
            return;
          }

          toast.success("Password changed successfully");
          form.reset();
        } catch {
          toast.error("An unexpected error occurred");
        }
      });
    },
  });

  return (
    <div className="bg-secondary/30 rounded-xl p-6 sm:p-8">
      <form
        className="flex w-full flex-col space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        {/* Current Password */}
        <form.Field
          name="currentPassword"
          children={(field) => (
            <div>
              <Label
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                Old Password
              </Label>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
                />
                <Button
                  size="icon"
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5"
                >
                  {showCurrentPassword ? <BsEye /> : <BsEyeSlash />}
                </Button>
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* New Password */}
        <form.Field
          name="newPassword"
          children={(field) => (
            <div>
              <Label
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                New Password
              </Label>
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
                  {showNewPassword ? <BsEye /> : <BsEyeSlash />}
                </Button>
              </div>
              <PasswordStrengthIndicator password={field.state.value} />
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Confirm New Password */}
        <form.Field
          name="confirmNewPassword"
          children={(field) => (
            <div>
              <Label
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your confirm new password"
                  className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
                />
                <Button
                  size="icon"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5"
                >
                  {showConfirmPassword ? <BsEye /> : <BsEyeSlash />}
                </Button>
              </div>
              <FieldInfo field={field} />
            </div>
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
                "bg-accent hover:bg-accent/90 text-accent-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition",
                {
                  "cursor-not-allowed opacity-50":
                    !canSubmit || isSubmitting || isPending,
                },
              )}
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Change Password"
              )}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
