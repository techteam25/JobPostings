import { z } from "zod";

export const workExperienceFormSchema = z
  .object({
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(100, "Company name must be 100 characters or less"),
    jobTitle: z
      .string()
      .min(1, "Job title is required")
      .max(100, "Job title must be 100 characters or less"),
    description: z.string().optional(),
    current: z.boolean().default(false),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.current && !data.endDate) return false;
      return true;
    },
    {
      message: "End date is required when not currently employed",
      path: ["endDate"],
    },
  );

export type WorkExperienceFormData = z.infer<typeof workExperienceFormSchema>;
