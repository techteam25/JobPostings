import { useState, useTransition } from "react";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import useLocalStorage from "@/hooks/use-local-storage";
import {
  RegistrationData,
  registrationSchema,
} from "@/schemas/auth/registration";
import { instance } from "@/lib/axios-instance";
import { ApiError } from "@/lib/types";
import { useSocialAuth } from "@/app/(auth)/sign-in/hooks/use-social";

export function useRegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { handleSocialAuth, isSocialPending } = useSocialAuth();
  const [, setIntent] = useLocalStorage<"seeker" | "employer">(
    "intent",
    "seeker",
  );
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
          const response = await instance.post<{
            token?: string | null;
            message?: string;
          }>("/auth/sign-up/email", {
            name: `${values.value.firstName} ${values.value.lastName}`,
            email: values.value.email,
            password: values.value.password,
            intent: values.value.accountType,
          });

          if (response.status === 200) {
            form.reset();
            if (response.data.token) {
              toast.success("Account created successfully!");
              window.location.href = "/post-login";
            } else {
              toast.success(
                "Account created! Please check your email to verify your account.",
              );
              window.location.href = `/verify-email?email=${encodeURIComponent(values.value.email)}`;
            }
          } else {
            toast.error(
              response.data.message || "Account creation unsuccessful",
            );
          }
        } catch (error: unknown) {
          if (error instanceof ApiError) {
            toast.error(error.message || "Account creation unsuccessful");
          } else {
            toast.error("An unexpected error occurred. Please try again.");
          }
          console.error("Registration error:", error);
        }
      });
    },
  });

  const handleRegistrationSocialAuth = (provider: "google" | "linkedin") =>
    handleSocialAuth(provider, form.state.values.accountType);

  return {
    form,
    isPending,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSocialAuth: handleRegistrationSocialAuth,
    isSocialPending,
    setIntent,
  };
}

export type RegistrationFormApi = ReturnType<
  typeof useRegistrationForm
>["form"];
