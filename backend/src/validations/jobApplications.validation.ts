import { z } from "@/swagger/registry";
import { createSelectSchema } from "drizzle-zod";
import { jobApplications } from "@/db/schema";
import { Job } from "@/validations/job.validation";
import { Organization } from "@/validations/organization.validation";
import { PaginationMeta } from "@shared/types";

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

const jobApplicationsSchema = createSelectSchema(jobApplications);
export const selectJobApplicationSchema = jobApplicationsSchema
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

export const applicationQueryParams = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z
    .enum([
      "pending",
      "reviewed",
      "shortlisted",
      "interviewing",
      "rejected",
      "hired",
      "withdrawn",
    ])
    .optional(),
});

export type ApplicationQueryParams = z.infer<typeof applicationQueryParams>;
export type GetJobApplicationSchema = z.infer<typeof getJobApplicationSchema>;
export type ApplyForJobSchema = z.infer<typeof applyForJobSchema>;
export type Application = z.infer<typeof jobApplicationsSchema>;
export type JobApplicationWithNotes = z.infer<
  typeof selectJobApplicationSchema
>;
export type JobApplication = {
  application: Pick<
    Application,
    | "id"
    | "applicantId"
    | "jobId"
    | "status"
    | "reviewedAt"
    | "appliedAt"
    | "coverLetter"
    | "resumeUrl"
  >;
  job: Pick<
    Job,
    | "id"
    | "title"
    | "city"
    | "state"
    | "country"
    | "zipcode"
    | "isRemote"
    | "jobType"
    | "employerId"
  >;
  applicant: { id: number; fullName: string; email: string };
};

export type ApplicationsByJobInterface = {
  items: Omit<JobApplication, "job">[];
  pagination: PaginationMeta;
};

export type ApplicationsByUserInterface = {
  items: {
    application: Application;
    job: Pick<
      Job,
      | "id"
      | "title"
      | "city"
      | "state"
      | "country"
      | "zipcode"
      | "isRemote"
      | "jobType"
    > | null;
    employer: Pick<Organization, "id" | "name"> | null;
  }[];
  pagination: PaginationMeta;
};
