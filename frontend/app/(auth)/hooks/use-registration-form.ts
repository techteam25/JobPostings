import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import useLocalStorage from "@/hooks/use-local-storage";
import {
  RegistrationData,
  registrationSchema,
} from "@/schemas/auth/registration";
import { instance } from "@/lib/axios-instance";
import { useSocialAuth } from "@/app/(auth)/sign-in/hooks/use-social";
import { isAxiosError } from "axios";

export function useRegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { handleSocialAuth, isSocialPending } = useSocialAuth();
  const [, setIntent] = useLocalStorage<"seeker" | "employer">(
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
            toast.success(
              "Account created! Please check your email to verify your account.",
            );
            form.reset();

            router.replace(
              `/verify-email?email=${encodeURIComponent(values.value.email)}`,
            );
          } else {
            toast.error(
              response.data.message || "Account creation unsuccessful",
            );
          }
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            const errorMessage =
              error.response?.data?.message || "Account creation unsuccessful";
            toast.error(errorMessage);
          } else {
            toast.error("An unexpected error occurred. Please try again.");
          }
          console.error("Registration error:", error);
        }
      });
    },
  });

  return {
    form,
    isPending,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSocialAuth,
    isSocialPending,
    setIntent,
  };
}

export type RegistrationFormApi = ReturnType<
  typeof useRegistrationForm
>["form"];
