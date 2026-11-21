"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";
import { Loader2 } from "lucide-react";

import { useRegistrationForm } from "../hooks/use-registration-form";
import { AccountTypeSelector } from "./AccountTypeSelector";
import { PersonalInfoFields } from "./PersonalInfoFields";
import { PasswordFields } from "./PasswordFields";
import { SocialAuthSection } from "./SocialAuthSection";

export default function RegistrationForm() {
  const {
    form,
    isPending,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSocialAuth,
    isSocialPending,
    setIntent,
  } = useRegistrationForm();

  return (
    <div className="bg-background rounded-2xl p-6 sm:p-8 md:p-10">
      <h2 className="text-foreground mb-2 text-lg font-bold sm:text-xl md:text-3xl">
        Create Account
      </h2>

      <div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            await form.handleSubmit();
          }}
          className="space-y-5"
        >
          <AccountTypeSelector form={form} onIntentChange={setIntent} />
          <PersonalInfoFields form={form} />
          <PasswordFields
            form={form}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />

          {/* Terms */}
          <form.Field
            name="hasAgreedToTerms"
            children={(field) => (
              <>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    aria-label="I agree to the Terms and Conditions and Privacy Policy"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    onBlur={field.handleBlur}
                    className="data-[state=checked]:bg-background data-[state=checked]:text-accent-foreground border-border mt-0.5 h-5 w-5 cursor-pointer"
                  />
                  <span className="text-secondary-foreground text-xs sm:text-sm">
                    <Label
                      htmlFor={field.name}
                      className="cursor-pointer text-xs sm:text-sm"
                    >
                      I agree to the
                    </Label>{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </div>
                <FieldInfo field={field} />
              </>
            )}
          />

          {/* Register Button */}
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.values.hasAgreedToTerms,
            ]}
            children={([canSubmit, isSubmitting, hasAgreedToTerms]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting || !hasAgreedToTerms}
                className={cn(
                  "bg-primary hover:bg-primary/90 text-primary-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition",
                  {
                    "cursor-not-allowed":
                      !canSubmit || isSubmitting || !hasAgreedToTerms,
                  },
                )}
              >
                {isPending ? (
                  <span>
                    <Loader2 className="size-5 animate-spin" />
                  </span>
                ) : (
                  <span>Register</span>
                )}
              </Button>
            )}
          />
        </form>

        <SocialAuthSection
          handleSocialAuth={handleSocialAuth}
          isSocialPending={isSocialPending}
          mode="register"
        />
      </div>
    </div>
  );
}
