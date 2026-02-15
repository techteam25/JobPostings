import { z } from "@/swagger/registry";
import { createSelectSchema } from "drizzle-zod";
import { jobApplications } from "@/db/schema";

const jobApplicationPayload = z
  .object({
    customAnswers: z.string().optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict();

const applicationIdParamSchema = z.object({
  applicationId: z
    .string()
    .regex(/^\d+$/, "applicationId must be a valid number"),
});

const jobIdParamSchema = z.object({
  jobId: z.string().regex(/^\d+$/, "jobId must be a valid number"),
});

export const applyForJobSchema = z.object({
  body: jobApplicationPayload,
  params: jobIdParamSchema,
  query: z.object({}).strict(),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    customAnswers: z.string().optional(),
    notes: z.string().max(5000).optional(),
  }),
  params: applicationIdParamSchema,
  query: z.object({}).strict(),
});

export const getJobApplicationSchema = z.object({
  body: z.object({}).strict(),
  params: applicationIdParamSchema,
  query: z.object({}).strict(),
});

export const deleteJobApplicationSchema = z.object({
  body: z.object({}).strict(),
  params: applicationIdParamSchema,
  query: z.object({}).strict(),
});

export const selectJobApplicationSchema = createSelectSchema(jobApplications)
  .omit({
    notes: true,
  })
  .extend({
    notes: z
      .object({
        note: z.string(),
        createdAt: z.date(),
      })
      .array(),
  });

export type GetJobApplicationSchema = z.infer<typeof getJobApplicationSchema>;
export type ApplyForJobSchema = z.infer<typeof applyForJobSchema>;

export type JobApplicationWithNotes = z.infer<
  typeof selectJobApplicationSchema
>;
