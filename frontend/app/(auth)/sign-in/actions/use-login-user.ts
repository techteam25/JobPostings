import { useMutation } from "@tanstack/react-query";

import { LoginInput } from "@/schemas/auth/login";
import { authClient } from "@/lib/auth";
import { toast } from "sonner";
import { redirect, RedirectType } from "next/navigation";

export const useLoginUser = () => {
  const { mutateAsync: loginUserAsync } = useMutation({
    mutationFn: async (payload: LoginInput) => {
      // Make the POST request to the login endpoint
      const { data } = await authClient.signIn.email(
        {
          email: payload.email,
          password: payload.password,
        },
        {
          onSuccess: () => {
            toast.success("Login successful!");
            redirect("/", RedirectType.replace);
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      );

      return data;
    },
  });

  return loginUserAsync;
};
