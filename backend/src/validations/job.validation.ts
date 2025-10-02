import { z } from "zod";

const createJobPayloadSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(255)
      .trim(),
    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .max(5000),
    location: z.string().min(1, "Location is required").max(255).trim(),
    jobType: z.enum([
      "full-time",
      "part-time",
      "contract",
      "volunteer",
      "internship",
      "short-term-trip",
    ]),
    compensationType: z.enum(["paid", "missionary", "volunteer", "stipend"]),
    experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().length(3).default("USD"),
    isRemote: z.boolean().default(false),
    applicationDeadline: z.iso
      .datetime()
      .transform((str) => new Date(str))
      .optional(),
    requiredSkills: z.string().optional(),
    preferredSkills: z.string().optional(),
    benefits: z.string().max(2000).optional(),
    employerId: z.number().int().positive().optional(),
  })
  .refine(
    (data) =>
      !data.salaryMax || !data.salaryMin || data.salaryMax >= data.salaryMin,
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    },
  )
  .refine(
    (data) =>
      data.compensationType !== "paid" ||
      (data.salaryMin && data.salaryMin > 0),
    {
      message: "Paid positions must specify minimum salary",
      path: ["salaryMin"],
    },
  );

const jobIdParamSchema = z.object({
  jobId: z.string().regex(/^\d+$/, "jobId must be a valid number"),
});

export const createJobSchema = z.object({
  body: createJobPayloadSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateJobSchema = z.object({
  body: createJobPayloadSchema.partial(),
  params: jobIdParamSchema,
  query: z.object({}).strict(),
});

export const getJobSchema = z.object({
  body: z.object({}).strict(),
  params: jobIdParamSchema,
  query: z.object({}).strict(),
});

export const deleteJobSchema = z.object({
  body: z.object({}).strict(),
  params: jobIdParamSchema,
  query: z.object({}).strict(),
});

export type CreateJobSchema = z.infer<typeof createJobSchema>;
export type GetJobSchema = z.infer<typeof getJobSchema>;
export type UpdateJobSchema = z.infer<typeof updateJobSchema>;
export type DeleteJobSchema = z.infer<typeof deleteJobSchema>;
