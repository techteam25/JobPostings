"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState("user");

  return (
    <div className="bg-background rounded-2xl p-8 md:p-10">
      <h2 className="text-foreground mb-2 text-3xl font-bold">
        Create Account
      </h2>
      <p className="text-secondary-foreground mb-6 text-sm sm:text-base">
        Join JobFinder and discover opportunities
      </p>

      <div className="space-y-5">
        {/* Account Type Selection */}
        <div>
          <Label className="text-secondary-foreground mb-3 block text-sm font-semibold">
            I am a...
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType("user")}
              className={cn(
                "cursor-pointer rounded-2xl border-2 p-4 transition",
                {
                  "border-chart-4 bg-background": accountType === "jobseeker",
                  "border-secondary hover:border-border":
                    accountType !== "jobseeker",
                },
              )}
            >
              <div className="mb-2 text-3xl">👤</div>
              <div className="text-foreground font-semibold">Job Seeker</div>
              <div className="text-muted-foreground text-xs">
                Looking for opportunities
              </div>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("employer")}
              className={cn(
                "cursor-pointer rounded-2xl border-2 p-4 transition",
                {
                  "border-chart-4 bg-background": accountType === "employer",
                  "border-secondary hover:border-border":
                    accountType !== "employer",
                },
              )}
            >
              <div className="mb-2 text-3xl">💼</div>
              <div className="text-foreground font-semibold">Employer</div>
              <div className="text-muted-foreground text-xs">Hiring talent</div>
            </button>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="first-name"
              className="text-secondary-foreground mb-2 block text-sm font-semibold"
            >
              First Name
            </Label>
            <Input
              id="first-name"
              placeholder="John"
              className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
            />
          </div>
          <div>
            <Label
              htmlFor="last-name"
              className="text-secondary-foreground mb-2 block text-sm font-semibold"
            >
              Last Name
            </Label>
            <Input
              id="last-name"
              placeholder="Doe"
              className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <Label className="text-secondary-foreground mb-2 block text-sm font-semibold">
            Email Address
          </Label>
          <Input
            type="email"
            placeholder="john.doe@example.com"
            className="border-border focus-visible:ring-accent w-full rounded-lg border px-4 py-3 transition outline-none focus-visible:border-transparent focus-visible:ring-2"
          />
        </div>

        {/* Password */}
        <div>
          <Label className="text-secondary-foreground mb-2 block text-sm font-semibold">
            Password
          </Label>
          <div className="relative">
            <Input
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
                <EyeOff className="size-6" />
              ) : (
                <Eye className="size-6" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Must be at least 8 characters
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <Label className="text-secondary-foreground mb-2 block text-sm font-semibold">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
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
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Terms */}
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent mt-0.5 h-5 w-5 cursor-pointer" />
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
        </label>

        {/* Continue Button */}
        <Button
          type="button"
          onClick={() => {}}
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition"
        >
          Register
        </Button>

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
          <button
            type="button"
            className="border-border flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="border-border flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </button>
        </div>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
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
