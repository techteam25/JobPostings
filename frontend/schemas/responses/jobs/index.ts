import { z } from "zod";

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  });
export const JobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  city: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  zipcode: z.number().nullable(),
  jobType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "volunteer",
    "internship",
  ]),
  compensationType: z.enum(["volunteer", "paid", "missionary", "stipend"]),
  isRemote: z.boolean(),
  isActive: z.boolean(),
  applicationDeadline: z.date().nullable(),
  experience: z.string().nullable(),
  employerId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  logoUrl: z.string().nullable(),
});

export const jobWithEmployerSchema = z.object({
  hasApplied: z.boolean().optional(),
  job: JobSchema,
  employer: organizationSchema.nullable(),
});

export const jobsResponseSchema = apiResponseSchema(
  z.array(jobWithEmployerSchema),
);
export const jobResponseSchema = apiResponseSchema(jobWithEmployerSchema);

export type JobsResponse = z.infer<typeof jobsResponseSchema>;
export type JobResponse = z.infer<typeof jobResponseSchema>;
export type Job = z.infer<typeof JobSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type JobWithEmployer = z.infer<typeof jobWithEmployerSchema>;
