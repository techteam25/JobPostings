"use client";

import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/common/FieldInfo";
import type { RegistrationFormApi } from "../hooks/use-registration-form";

interface PasswordFieldsProps {
  form: RegistrationFormApi;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PasswordFields({
  form,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: PasswordFieldsProps) {
  return (
    <>
      {/* Password */}
      <form.Field
        name="password"
        children={(field) => (
          <div>
            <Label
              htmlFor={field.name}
              className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
              />
              <Button
                size="icon"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5 md:[&_svg]:size-6"
              >
                {showPassword ? <Eye /> : <EyeOff />}
              </Button>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Must be at least 8 characters
            </p>
            <FieldInfo field={field} />
          </div>
        )}
      />

      {/* Confirm Password */}
      <form.Field
        name="confirmPassword"
        children={(field) => (
          <div>
            <Label
              htmlFor={field.name}
              className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="border-border focus:ring-accent w-full rounded-lg border px-4 py-3 pr-12 transition outline-none focus:border-transparent focus:ring-2"
              />
              <Button
                size="icon"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent [&_svg]:size-4 sm:[&_svg]:size-5 md:[&_svg]:size-6"
              >
                {showConfirmPassword ? <Eye /> : <EyeOff />}
              </Button>
            </div>
            <FieldInfo field={field} />
          </div>
        )}
      />
    </>
  );
}
