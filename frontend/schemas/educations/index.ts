import { z } from "zod";

export const PROGRAM_OPTIONS = [
  "GED",
  "High School Diploma",
  "Associate Degree",
  "Bachelors",
  "Masters",
  "Doctorate",
] as const;

export type Program = (typeof PROGRAM_OPTIONS)[number];

export const educationFormSchema = z
  .object({
    schoolName: z
      .string()
      .min(1, "School name is required")
      .max(100, "School name must be 100 characters or less"),
    program: z.enum(PROGRAM_OPTIONS, {
      message: "Program is required",
    }),
    major: z
      .string()
      .min(1, "Major is required")
      .max(100, "Major must be 100 characters or less"),
    graduated: z.boolean().default(false),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
  })
  .refine((data) => !data.graduated || (data.graduated && data.endDate), {
    message: "End date is required when graduated",
    path: ["endDate"],
  });

export type EducationFormData = z.infer<typeof educationFormSchema>;
