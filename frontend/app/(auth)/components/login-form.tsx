"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

import { LoginInput, loginSchema } from "@/schemas/auth/login";
import { authClient } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";

import { BsEye, BsEyeSlash, BsLinkedin } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";
import { useSocialAuth } from "@/app/(auth)/sign-in/hooks/use-social";
import { LoginResponse } from "@/schemas/responses/auth";

const loginInput: LoginInput = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const { handleSocialAuth, isSocialPending } = useSocialAuth();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: loginInput,
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async (values) => {
      startTransition(async () => {
        try {
          const { error, data } = (await authClient.signIn.email({
            email: values.value.email,
            password: values.value.password,
            rememberMe: values.value.rememberMe,
          })) as unknown as { error: any; data: LoginResponse | null };

          if (error) {
            toast.error(error.message || "Login unsuccessful");
            return;
          }

          toast.success("Login successful!");
          form.reset();

          router.replace(data?.user.redirectUrl || "/");
        } catch (error) {
          toast.error("An unexpected error occurred");
          console.error("Login error:", error);
        }
      });
    },
  });

  return (
    <div className="bg-background flex w-full max-w-lg items-center justify-center rounded-2xl px-6 py-12 shadow-md lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm md:max-w-lg">
        <div className="mb-10 space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            src={GetInvolvedLogo}
            alt="Get Involved Logo"
            className="mx-auto h-16 w-auto md:h-20"
          />
          <h2 className="text-foreground text-center text-xl font-bold tracking-tight md:text-2xl/9">
            Sign in to your account
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
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="rememberMe"
              children={(field) => (
                <div className="mb-6 flex items-center justify-between">
                  <Label
                    htmlFor={field.name}
                    className="flex cursor-pointer items-center"
                  >
                    <Checkbox
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                      className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent mt-0.5 h-4 w-4 cursor-pointer md:h-5 md:w-5"
                    />
                    <span className="text-secondary-foreground ml-2 text-xs sm:text-sm">
                      Remember me
                    </span>
                  </Label>
                  <Button
                    variant="link"
                    className="text-muted-foreground cursor-pointer text-xs sm:text-sm"
                  >
                    Forgot password?
                  </Button>
                </div>
              )}
            />

            {/* Login Button */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={cn(
                    "bg-accent hover:bg-accent/90 text-accent-foreground w-full cursor-pointer rounded-lg py-3 font-semibold transition",
                    {
                      "cursor-not-allowed": !canSubmit || isSubmitting,
                    },
                  )}
                >
                  {isPending ? (
                    <span>
                      <Loader2 className="size-5 animate-spin" />
                    </span>
                  ) : (
                    <span>Login</span>
                  )}
                </Button>
              )}
            />
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="border-border w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background text-muted-foreground px-4">
                Or continue with
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
              onClick={async () => await handleSocialAuth("google")}
            >
              <FcGoogle className="size-6" />
              Google
            </Button>
            <Button
              disabled={isSocialPending}
              variant="ghost"
              type="button"
              className="border-border hover:bg-secondary hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition"
              onClick={async () => await handleSocialAuth("linkedin")}
            >
              <BsLinkedin className="size-6 text-[#0072b1]" />
              LinkedIn
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="text-secondary-foreground mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Button
              asChild
              variant="link"
              className="text-accent hover:text-accent/90 cursor-pointer font-semibold"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
