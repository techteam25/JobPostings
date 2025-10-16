"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { BsEye, BsEyeSlash } from "react-icons/bs";
import { BsFillPersonFill } from "react-icons/bs";
import { BsLinkedin } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { MdWork } from "react-icons/md";

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
                  "border-chart-4 bg-background": accountType === "user",
                  "border-secondary hover:border-border":
                    accountType !== "user",
                },
              )}
            >
              <div className="mb-2 flex justify-center text-4xl">
                <BsFillPersonFill className="text-chart-1" />
              </div>
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
              <div className="mb-2 flex justify-center text-4xl">
                <MdWork className="text-chart-2" />
              </div>
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
                <BsEyeSlash className="size-6" />
              ) : (
                <BsEye className="size-6" />
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
                <BsEyeSlash className="size-5" />
              ) : (
                <BsEye className="size-5" />
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
            <FcGoogle className="size-6" />
            Google
          </button>
          <button
            type="button"
            className="border-border flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition hover:bg-gray-50"
          >
            <BsLinkedin className="size-6 text-[#0072b1]" />
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
