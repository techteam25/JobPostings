import { z } from "zod";

export const jobApplicationSchema = z.object({
  // Location info (pre-populated from profile, editable)
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),

  // Additional questions
  customAnswers: z.object({
    salvationStatement: z
      .string()
      .min(10, "Please share your salvation experience"),
    race: z.string().min(1, "Please select a race"),
    gender: z.enum(["Male", "Female"], {
      message: "Please select a gender",
    }),
    veteranStatus: z.string().min(1, "Please select veteran status"),
    yearsOfExperience: z.enum(["0-1", "2-4", "5-9", "10+"], {
      message: "Please select years of experience",
    }),
    authorized: z.enum(["yes", "no"], {
      message: "Please select an option",
    }),
  }),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
