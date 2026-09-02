import { z } from "zod";

export const createJobSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title cannot exceed 255 characters"),
  description: z.string().min(1, "Description is required"),
  city: z.string().min(1, "City is required"),
  state: z.string(),
  country: z.string().min(1, "Country is required"),
  zipcode: z
    .union([z.string(), z.number(), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const normalized = String(value).trim();
      return normalized.length === 0 ? null : normalized;
    })
    .refine((value) => value === null || value.length <= 20, {
      message: "Zip code cannot exceed 20 characters",
    }),
  jobType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "volunteer",
    "internship",
  ]),
  compensationType: z.enum(["paid", "missionary", "volunteer", "stipend"]),
  isRemote: z.boolean(),
  applicationDeadline: z.string().nullable(),
  experience: z.string(),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;
