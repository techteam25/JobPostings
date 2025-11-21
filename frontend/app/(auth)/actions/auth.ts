"use server";

import { LoginInput, loginSchema } from "@/schemas/auth/login";
import {
  RegistrationData,
  registrationSchema,
} from "@/schemas/auth/registration";
import { env } from "@/env";
import { instance } from "@/lib/axios-instance";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Server action for email/password login
 */
export async function loginAction(
  input: LoginInput,
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    // Validate input
    const validated = loginSchema.safeParse(input);
    if (!validated.success) {
      const errors = validated.error.issues.reduce(
        (acc, issue) => {
          const field = issue.path[0] as keyof typeof input;
          if (!acc[field]) {
            acc[field] = [];
          }
          acc[field].push(issue.message);
          return acc;
        },
        {} as Record<string, string[]>,
      );
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid input",
      };
    }

    // Make request to better-auth server endpoint
    const response = await instance.post(
      `/auth/sign-in/email`,
      {
        email: validated.data.email,
        password: validated.data.password,
        rememberMe: validated.data.rememberMe,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    if (response.status !== 200) {
      return {
        success: false,
        error: data.message || "Login failed",
      };
    }

    return {
      success: true,
      data: { redirectUrl: "/" },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server action for user registration
 */
export async function registerAction(
  input: RegistrationData,
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    // Validate input
    const validated = registrationSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message;
      return {
        success: false,
        error: firstError || "Invalid input",
      };
    }

    // Make request to registration endpoint
    const response = await instance.post(
      `${env.NEXT_PUBLIC_SERVER_URL}/auth/sign-up/email`,
      {
        name: `${validated.data.firstName} ${validated.data.lastName}`,
        email: validated.data.email,
        password: validated.data.password,
        intent: validated.data.accountType,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    if (response.status !== 200) {
      return {
        success: false,
        error: data.message || "Registration failed",
      };
    }

    // Determine redirect URL based on user intent
    const redirectUrl =
      data.user?.intent === "employer" ? "/employer/onboarding" : "/";

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server action to get social auth URL
 */
export async function getSocialAuthUrl(
  provider: "google" | "linkedin",
): Promise<ActionResult<{ url: string }>> {
  try {
    const callbackURL = `${env.NEXT_PUBLIC_FRONTEND_URL}/`;
    const authUrl = `${env.NEXT_PUBLIC_SERVER_URL}/auth/sign-in/${provider}?callbackURL=${encodeURIComponent(callbackURL)}`;

    return {
      success: true,
      data: { url: authUrl },
    };
  } catch (error) {
    console.error("Social auth URL error:", error);
    return {
      success: false,
      error: "Failed to get authentication URL",
    };
  }
}
