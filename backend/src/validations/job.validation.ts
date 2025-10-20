import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jobApplications, jobInsights, jobsDetails } from "@/db/schema";
import { Organization } from "@/validations/organization.validation";

// Validation schemas
export const insertJobSchema = createInsertSchema(jobsDetails, {
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
  salaryMin: z.number().positive("Salary must be positive").optional(),
  salaryMax: z.number().positive("Salary must be positive").optional(),
  employerId: z.number().int().positive("Employer ID is required"),
}).refine(
  (data) =>
    !data.salaryMax || !data.salaryMin || data.salaryMax >= data.salaryMin,
  {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryMax"],
  },
);

export const insertJobApplicationSchema = createInsertSchema(jobApplications, {
  jobId: z.number().int().positive("Job ID is required"),
  applicantId: z.number().int().positive("Applicant ID is required"),
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000)
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
});

export const insertJobInsightsSchema = createInsertSchema(jobInsights, {
  viewCount: z.int().min(0, { error: "View Count cannot be less than 0" }),
  applicationCount: z
    .int()
    .min(0, { error: "Application Count cannot be less than 0" }),
});

export const selectJobSchema = createSelectSchema(jobsDetails);
export const selectJobInsightsSchema = createSelectSchema(jobInsights);
export const selectJobApplicationSchema = createSelectSchema(jobApplications);

export const updateJobInputSchema = insertJobSchema.partial().omit({
  id: true,
  createdAt: true,
  employerId: true,
  postedById: true,
});

export const updateJobApplicationSchema = insertJobApplicationSchema
  .partial()
  .omit({
    id: true,
    jobId: true,
    applicantId: true,
    appliedAt: true,
    createdAt: true,
    updatedAt: true,
    reviewedAt: true,
    reviewedBy: true,
  });

export const updateJobInsightsSchema = insertJobInsightsSchema
  .partial()
  .omit({ id: true });

const createJobPayloadSchema = insertJobSchema
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

// Type exports
export type Job = z.infer<typeof selectJobSchema>;
export type JobInsight = z.infer<typeof selectJobInsightsSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobInputSchema>;
export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type NewJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateJobApplicationSchema>;
export type UpdateJobInsights = z.infer<typeof updateJobInsightsSchema>;
export type JobWithEmployer = {
  job: Job;
  employer: Pick<Organization, "id" | "name" | "city" | "state"> | null;
}[];
export type CreateJobSchema = z.infer<typeof createJobSchema>;
export type GetJobSchema = z.infer<typeof getJobSchema>;
export type UpdateJobSchema = z.infer<typeof updateJobSchema>;
export type DeleteJobSchema = z.infer<typeof deleteJobSchema>;
