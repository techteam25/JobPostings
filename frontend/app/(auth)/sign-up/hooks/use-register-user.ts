import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  RegistrationInput,
  RegistrationData,
} from "@/schemas/auth/registration";
import { toast } from "sonner";
import useLocalStorage from "@/hooks/use-local-storage";
import { instance } from "@/lib/axios-instance";
import { RegistrationResponse } from "@/schemas/responses/auth";

enum IntentEnum {
  SEEKER = "seeker",
  EMPLOYER = "employer",
}
export const useRegisterUser = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [intent] = useLocalStorage<"seeker" | "employer">(
    "intent",
    IntentEnum.SEEKER,
  );

  const { mutateAsync: createUserAsync, isPending: isRegistrationPending } =
    useMutation({
      mutationFn: async (formData: RegistrationData) => {
        const payload: RegistrationInput = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          intent: formData.accountType,
        };

        // Make the POST request to the registration endpoint
        const res = await instance.post<RegistrationResponse>(
          "/auth/sign-up/email",
          {
            name: `${payload.firstName} ${payload.lastName}`,
            email: payload.email,
            password: payload.password,
            intent: payload.intent,
          }, // Note: include intent in response from backend
        );

        if (res.status !== 200) {
          throw new Error("Failed to register user");
        }

        return res.data;
      },
      onSuccess: async (data) => {
        toast.success("Account creation successful!");
        await queryClient.invalidateQueries({ queryKey: ["get-user-session"] });

        if (data?.user.intent === IntentEnum.EMPLOYER) {
          router.replace("/employer/onboarding");
        } else {
          router.replace("/");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Account creation unsuccessful");
      },
    });

  return { createUserAsync, isRegistrationPending };
};
