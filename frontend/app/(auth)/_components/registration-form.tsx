"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BsEye, BsEyeSlash } from "react-icons/bs";
import { BsFillPersonFill } from "react-icons/bs";
import { BsLinkedin } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { MdWork } from "react-icons/md";
import {
  RegistrationData,
  registrationSchema,
} from "@/schemas/auth/registration";
import { FieldInfo } from "@/components/common/FieldInfo";

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registrationInput: RegistrationData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "user",
    hasAgreedToTerms: false,
  };

  const form = useForm({
    defaultValues: registrationInput,
    validators: {
      onChange: registrationSchema,
    },
    onSubmit: (values) => {
      console.log("Form Submitted", { values });
    },
  });

  return (
    <div className="bg-background rounded-2xl p-8 md:p-10">
      <h2 className="text-foreground mb-2 text-3xl font-bold">
        Create Account
      </h2>
      <p className="text-secondary-foreground mb-6 text-sm sm:text-base">
        Join JobFinder and discover opportunities
      </p>

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
            <Label className="text-secondary-foreground mb-3 block text-sm font-semibold">
              I am a...
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="accountType"
                children={(field) => (
                  <button
                    type="button"
                    onClick={() => field.setValue("user")}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-4 transition",
                      {
                        "border-chart-4 bg-background":
                          field.state.value === "user",
                        "border-secondary hover:border-border":
                          field.state.value !== "user",
                      },
                    )}
                  >
                    <div className="mb-2 flex justify-center text-4xl">
                      <BsFillPersonFill className="text-chart-1" />
                    </div>
                    <div className="text-foreground font-semibold">
                      Job Seeker
                    </div>
                    <div className="text-muted-foreground text-xs">
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
                    onClick={() => field.setValue("employer")}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-4 transition",
                      {
                        "border-chart-4 bg-background":
                          field.state.value === "employer",
                        "border-secondary hover:border-border":
                          field.state.value !== "employer",
                      },
                    )}
                  >
                    <div className="mb-2 flex justify-center text-4xl">
                      <MdWork className="text-chart-2" />
                    </div>
                    <div className="text-foreground font-semibold">
                      Employer
                    </div>
                    <div className="text-muted-foreground text-xs">
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
                      field.handleChange(e.target.value as "user" | "employer")
                    }
                    type="hidden"
                  />
                )}
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              children={(field) => (
                <div>
                  <Label
                    htmlFor={field.name}
                    className="text-secondary-foreground mb-2 block text-sm font-semibold"
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
                    className="text-secondary-foreground mb-2 block text-sm font-semibold"
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
                  className="text-secondary-foreground mb-2 block text-sm font-semibold"
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
                  className="text-secondary-foreground mb-2 block text-sm font-semibold"
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
                    className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent"
                  >
                    {showPassword ? (
                      <BsEye className="size-6" />
                    ) : (
                      <BsEyeSlash className="size-6" />
                    )}
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
                  className="text-secondary-foreground mb-2 block text-sm font-semibold"
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
                    className="hover:text-secondary-foreground text-secondary-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer border-none bg-transparent shadow-none hover:bg-transparent"
                  >
                    {showConfirmPassword ? (
                      <BsEye className="size-5" />
                    ) : (
                      <BsEyeSlash className="size-5" />
                    )}
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
                  <span className="text-secondary-foreground text-sm">
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
                Register
              </Button>
            )}
          />
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background text-muted-foreground px-4">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Social Sign Up */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="ghost"
            type="button"
            className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
          >
            <FcGoogle className="size-6" />
            Google
          </Button>
          <Button
            variant="ghost"
            type="button"
            className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
          >
            <BsLinkedin className="size-6 text-[#0072b1]" />
            LinkedIn
          </Button>
        </div>

        {/* Sign In Link */}
        <p className="text-secondary-foreground mt-6 text-center text-sm">
          Already have an account?{" "}
          <Button
            variant="link"
            className="text-accent hover:text-accent/90 cursor-pointer font-semibold"
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
