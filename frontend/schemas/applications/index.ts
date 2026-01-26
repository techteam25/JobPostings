import { z } from "zod";

export const jobApplicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  // Resume validator logic is mostly UI based (file size etc), schema just checks presence if needed
  resume: z.any().optional(),
  linkedIn: z.url("Invalid URL").optional().or(z.literal("")),
  website: z.url("Invalid URL").optional().or(z.literal("")),
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .optional()
    .or(z.literal("")),
  customAnswers: z
    .object({
      authorized: z.enum(["yes", "no"], {
        error: "Please select an option",
      }),
    })
    .optional(),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
