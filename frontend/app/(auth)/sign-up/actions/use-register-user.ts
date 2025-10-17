import { AxiosResponse } from "axios";
import { useMutation } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";

import type {
  RegistrationInput,
  RegistrationData,
} from "@/schemas/auth/registration";
import type { ApiResponse } from "@/schemas/responses";
import type { AuthTokens, User } from "@/schemas/responses/auth";

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
      const response = await instance.post<
        ApiResponse<{ user: User; tokens: AuthTokens }>,
        AxiosResponse<ApiResponse<{ user: User; tokens: AuthTokens }>>,
        RegistrationInput
      >("/auth/register", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log("User registered successfully:", data);
      // Handle successful registration (e.g., redirect, show message)
    },
    onError: (error: any) => {
      console.error("Error registering user:", error.message);
      // Handle error (e.g., show error message)
    },
  });

  return createUserAsync;
};
