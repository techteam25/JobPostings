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
import { FieldInfo } from "@/components/common/FieldInfo";

import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";
import { PasswordStrengthIndicator } from "@/components/common/password-strength-indicator";

const defaultValues: ChangePasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

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
            <Field>
              <FieldLabel
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                Old Password
              </FieldLabel>
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
                  {showCurrentPassword ? <Eye /> : <EyeOff />}
                </Button>
              </div>
              <FieldInfo field={field} />
            </Field>
          )}
        />

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
                  placeholder="Enter your confirm new password"
                  className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
                />
                <Button
                  size="icon"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                "Change Password"
              )}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
