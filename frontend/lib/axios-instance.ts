import axios, { AxiosError } from "axios";
import { env } from "@/env";
import { ApiError, ApiErrorResponse } from "@/lib/types";

export const instance = axios.create({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  timeout: 10000,
  withCredentials: true,
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    const statusCode = error.response?.status || 500;
    const errorCode = error.response?.data?.errorCode || "UNKNOWN_ERROR";

    return Promise.reject(new ApiError(statusCode, message, errorCode));
  },
);
