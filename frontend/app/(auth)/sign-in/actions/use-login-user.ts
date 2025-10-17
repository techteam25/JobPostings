import { AxiosResponse } from "axios";
import { useMutation } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";

import type { ApiResponse } from "@/schemas/responses";
import type { AuthTokens } from "@/schemas/responses/auth";
import { LoginInput } from "@/schemas/auth/login";

export const useLoginUser = () => {
  const { mutateAsync: loginUserAsync } = useMutation({
    mutationFn: async (payload: LoginInput) => {
      // Make the POST request to the login endpoint
      const response = await instance.post<
        ApiResponse<{ tokens: AuthTokens }>,
        AxiosResponse<ApiResponse<{ tokens: AuthTokens }>>,
        LoginInput
      >("/auth/login", payload, {
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
      console.log("User logged in successfully:", data);
      // Handle successful login (e.g., redirect, show message)
    },
    onError: (error: any) => {
      console.error("Error logging in user:", error.message);
      // Handle error (e.g., show error message)
    },
  });

  return loginUserAsync;
};
