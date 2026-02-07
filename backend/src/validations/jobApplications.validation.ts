import { z } from "@/swagger/registry";
import { createSelectSchema } from "drizzle-zod";
import { jobApplications } from "@/db/schema";

const ALLOWED_RESUME_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB

const jobApplicationPayload = z
  .object({
    coverLetter: z
      .string()
      .min(50, "Cover letter must be at least 50 characters")
      .max(2000, "Cover letter must not exceed 2000 characters")
      .optional(),
    resume: z
      .custom<Express.Multer.File>(
        (val) =>
          val != null &&
          typeof val === "object" &&
          "mimetype" in val &&
          "size" in val,
        { message: "Expected a valid Multer file" },
      )
      .optional()
      .openapi({
        type: "string",
        format: "binary",
        description: "Resume file (max size 5MB)",
      }),
    resumeUrl: z.url("Invalid resume URL").optional(),
    customAnswers: z.string().max(5000).optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.resume || ALLOWED_RESUME_MIMETYPES.includes(data.resume.mimetype),
    {
      message: "Resume must be a PDF, DOC, or DOCX file",
      path: ["resume"],
    },
  )
  .refine((data) => !data.resume || data.resume.size <= MAX_RESUME_SIZE, {
    message: "Resume must not exceed 5MB",
    path: ["resume"],
  });

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
    coverLetter: z
      .string()
      .min(50, "Cover letter must be at least 50 characters")
      .max(2000, "Cover letter must not exceed 2000 characters")
      .optional(),
    customAnswers: z.string().max(5000).optional(),
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
