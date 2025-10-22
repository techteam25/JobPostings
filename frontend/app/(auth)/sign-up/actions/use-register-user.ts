import { useMutation } from "@tanstack/react-query";

import type {
  RegistrationInput,
  RegistrationData,
} from "@/schemas/auth/registration";
import { authClient } from "@/lib/auth";
import { redirect, RedirectType } from "next/navigation";
import { toast } from "sonner";

export const useRegisterUser = () => {
  const { mutateAsync: createUserAsync } = useMutation({
    mutationFn: async (formData: RegistrationData) => {
      const payload: RegistrationInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.accountType,
      };

      // Make the POST request to the registration endpoint
      const { data, error } = await authClient.signUp.email(
        {
          email: payload.email,
          password: payload.password,
          name: payload.firstName + " " + payload.lastName,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
            toast.success("Account creation successful!");
            redirect("/", RedirectType.replace);
          },
          onError: () => {
            toast.error("Account creation unsuccessful");
          },
        },
      );

      if (error) {
        console.error(error);
        toast.error("Account creation unsuccessful");
      }

      return data;
    },
  });

  return createUserAsync;
};
