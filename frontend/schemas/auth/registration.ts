import { z } from "zod";

export const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
    accountType: z.enum(["user", "employer"], {
      error: "Account type is required",
    }),
    hasAgreedToTerms: z.boolean(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match",
  });

export type RegistrationData = z.infer<typeof registrationSchema>;
export type RegistrationInput = Omit<
  RegistrationData,
  "accountType" | "confirmPassword" | "hasAgreedToTerms"
> & {
  role: "user" | "employer";
};
