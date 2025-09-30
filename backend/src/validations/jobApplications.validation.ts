import { z } from "zod";

const jobApplicationPayload = z.object({
  jobId: z.coerce.number(),
  applicantId: z.coerce.number(),
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000, "Cover letter must not exceed 2000 characters")
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
  customAnswers: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

const jobApplicationIdParamSchema = z.object({
  jobId: z.coerce.number("jobApplicationId is required"),
});

export const jobApplicationSchema = z.object({
  body: jobApplicationPayload,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateApplicationStatusSchema = z.object({
  body: jobApplicationPayload
    .partial()
    .omit({ jobId: true, applicantId: true }),
  params: jobApplicationIdParamSchema,
  query: z.object({}).strict(),
});

export const getJobApplicationSchema = z.object({
  body: z.object({}).strict(),
  params: jobApplicationIdParamSchema,
  query: z.object({}).strict(),
});

export const deleteJobApplicationSchema = z.object({
  body: z.object({}).strict(),
  params: jobApplicationIdParamSchema,
  query: z.object({}).strict(),
});
