"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";

import { BsEye, BsEyeSlash } from "react-icons/bs";
import { BsFillPersonFill } from "react-icons/bs";
import { BsLinkedin } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { MdWork } from "react-icons/md";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import useLocalStorage from "@/hooks/use-local-storage";
import {
  RegistrationData,
  registrationSchema,
} from "@/schemas/auth/registration";

import { instance } from "@/lib/axios-instance";
import { useSocialAuth } from "@/app/(auth)/sign-in/hooks/use-social";

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { handleSocialAuth, isSocialPending } = useSocialAuth();
  const [_, setIntent] = useLocalStorage<"seeker" | "employer">(
    "intent",
    "seeker",
  );
  const router = useRouter();

  const registrationInput: RegistrationData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "seeker",
    hasAgreedToTerms: false,
  };

  const form = useForm({
    defaultValues: registrationInput,
    validators: {
      onChange: registrationSchema,
    },
    onSubmit: async (values) => {
      startTransition(async () => {
        try {
          const response = await instance.post("/auth/sign-up/email", {
            name: `${values.value.firstName} ${values.value.lastName}`,
            email: values.value.email,
            password: values.value.password,
            intent: values.value.accountType,
          });

          if (response.status === 200) {
            toast.success("Account creation successful!");
            form.reset();

            const redirectUrl =
              response.data.user?.intent === "employer"
                ? "/employer/onboarding"
                : "/";
            router.replace(redirectUrl);
          } else {
            toast.error(
              response.data.message || "Account creation unsuccessful",
            );
          }
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Account creation unsuccessful";
          toast.error(errorMessage);
          console.error("Registration error:", error);
        }
      });
    },
  });

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
          {/* Account Type Selection */}
          <div>
            <Label className="text-secondary-foreground mb-3 block text-xs font-semibold sm:text-sm">
              I am a...
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="accountType"
                children={(field) => (
                  <button
                    type="button"
                    onClick={() => {
                      field.setValue("seeker");
                      setIntent("seeker");
                    }}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-2 transition sm:p-4",
                      {
                        "border-chart-4 bg-background":
                          field.state.value === "seeker",
                        "border-secondary hover:border-border":
                          field.state.value !== "seeker",
                      },
                    )}
                  >
                    <div className="mb-2 flex justify-center text-2xl sm:text-4xl">
                      <BsFillPersonFill className="text-chart-1" />
                    </div>
                    <div className="text-foreground font-semibold">
                      Job Seeker
                    </div>
                    <div className="text-muted-foreground hidden text-xs sm:block">
                      Looking for opportunities
                    </div>
                  </button>
                )}
              />

              <form.Field
                name="accountType"
                children={(field) => (
                  <button
                    type="button"
                    onClick={() => {
                      field.setValue("employer");
                      setIntent("employer");
                    }}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-2 transition sm:p-4",
                      {
                        "border-chart-4 bg-background":
                          field.state.value === "employer",
                        "border-secondary hover:border-border":
                          field.state.value !== "employer",
                      },
                    )}
                  >
                    <div className="mb-2 flex justify-center text-2xl sm:text-4xl">
                      <MdWork className="text-chart-2" />
                    </div>
                    <div className="text-foreground font-semibold">
                      Employer
                    </div>
                    <div className="text-muted-foreground hidden text-xs sm:block">
                      Hiring talent
                    </div>
                  </button>
                )}
              />
              <form.Field
                name="accountType"
                children={(field) => (
                  <input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value as "seeker" | "employer",
                      )
                    }
                    type="hidden"
                  />
                )}
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid gap-4 xl:grid-cols-2">
            <form.Field
              name="firstName"
              children={(field) => (
                <div>
                  <Label
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
                  >
                    First Name
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="John"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="lastName"
              children={(field) => (
                <div>
                  <Label
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
                  >
                    Last Name
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Doe"
                    className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          {/* Email */}
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
                    {showPassword ? <BsEye /> : <BsEyeSlash />}
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
                    {showConfirmPassword ? <BsEye /> : <BsEyeSlash />}
                  </Button>
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          />

          {/* Terms */}
          <form.Field
            name="hasAgreedToTerms"
            children={(field) => (
              <>
                <Label
                  htmlFor={field.name}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    onBlur={field.handleBlur}
                    className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent mt-0.5 h-5 w-5 cursor-pointer"
                  />
                  <span className="text-secondary-foreground text-xs sm:text-sm">
                    I agree to the{" "}
                    <span className="text-accent hover:text-accent/90 cursor-pointer font-semibold">
                      Terms & Conditions
                    </span>{" "}
                    and{" "}
                    <span className="text-accent hover:text-accent/90 cursor-pointer font-semibold">
                      Privacy Policy
                    </span>
                  </span>
                </Label>
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
                  "bg-accent hover:bg-accent/90 text-accent-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition",
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="bg-background text-muted-foreground px-4">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Social Sign Up */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            disabled={isSocialPending}
            variant="ghost"
            type="button"
            className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
            onClick={() => handleSocialAuth("google")}
          >
            <FcGoogle className="size-6" />
            Google
          </Button>
          <Button
            disabled={isSocialPending}
            variant="ghost"
            type="button"
            className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
            onClick={() => handleSocialAuth("linkedin")}
          >
            <BsLinkedin className="size-6 text-[#0072b1]" />
            LinkedIn
          </Button>
        </div>

        {/* Sign In Link */}
        <p className="text-secondary-foreground mt-6 text-center text-xs sm:text-sm">
          Already have an account?{" "}
          <Button
            asChild
            variant="link"
            className="text-accent hover:text-accent/90 cursor-pointer text-xs font-semibold sm:text-sm"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
