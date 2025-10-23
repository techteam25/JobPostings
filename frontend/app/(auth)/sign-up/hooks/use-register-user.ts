import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  RegistrationInput,
  RegistrationData,
} from "@/schemas/auth/registration";
import { authClient } from "@/lib/auth";
import { redirect, RedirectType } from "next/navigation";
import { toast } from "sonner";

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: createUserAsync, isPending: isRegistrationPending } =
    useMutation({
      mutationFn: async (formData: RegistrationData) => {
        const payload: RegistrationInput = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.accountType,
        };

        // Make the POST request to the registration endpoint
        const { data } = await authClient.signUp.email(
          {
            email: payload.email,
            password: payload.password,
            name: payload.firstName + " " + payload.lastName,
            callbackURL: "/",
          },
          {
            onSuccess: () => {
              toast.success("Account creation successful!");
              queryClient.invalidateQueries({ queryKey: ["get-user-session"] });
              redirect("/", RedirectType.replace);
            },
            onError: (error) => {
              toast.error(
                error.error.message || "Account creation unsuccessful",
              );
            },
          },
        );

        return data;
      },
    });

  return { createUserAsync, isRegistrationPending };
};
