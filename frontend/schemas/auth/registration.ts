import { z } from "zod";

export const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
    accountType: z.enum(["seeker", "employer"], {
      error: "Account type is required",
    }),
    hasAgreedToTerms: z.boolean(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((input) => input.hasAgreedToTerms, {
    message: "You must agree to the Terms & Conditions and Privacy Policy",
    path: ["hasAgreedToTerms"],
  });

export type RegistrationData = z.infer<typeof registrationSchema>;
export type RegistrationInput = Omit<
  RegistrationData,
  "accountType" | "confirmPassword" | "hasAgreedToTerms"
> & {
  intent: "seeker" | "employer";
};
