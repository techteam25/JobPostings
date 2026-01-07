import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jobApplications, jobInsights, jobsDetails, skills } from "@/db/schema";
import { Organization } from "@/validations/organization.validation";

// Base schema WITHOUT refinements (for use with .partial())
const insertJobBaseSchema = createInsertSchema(jobsDetails, {
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255)
    .trim(),
  description: z.string(),
  city: z.string().min(1, "City is required").max(255).trim(),
  state: z.string().max(50).trim().optional(),
  country: z.string().max(100).trim().optional().default("United States"),
  zipcode: z.coerce.number().positive("Zip Code must be positive").optional(),
  employerId: z.number().int().positive("Employer ID is required"),
});

// Full insert schema WITH refinements (for creating new jobs)
export const insertJobSchema = insertJobBaseSchema
  .refine((data) => data.country === "United States" && !data.state, {
    message: "State is required for United States",
    path: ["state"],
  })
  .refine((data) => data.country === "United States" && !data.zipcode, {
    message: "Zip Code is required for United States",
  });

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
export const selectJobSkillsSchema = createSelectSchema(skills);

// Update schema: use base schema, apply partial FIRST, then add refinements
export const updateJobInputSchema = insertJobBaseSchema
  .partial()
  .omit({
    id: true,
    createdAt: true,
    employerId: true,
  })
  .extend({
    skills: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Only validate if country is provided and is "United States"
      if (data.country === "United States") {
        return !!data.state && !!data.zipcode;
      }
      return true;
    },
    {
      message: "State and Zip Code are required for United States",
    },
  );

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

// Create job payload schema: use base schema, omit fields, extend, then add refinements
const createJobPayloadBaseSchema = insertJobBaseSchema
  .omit({ applicationDeadline: true, employerId: true })
  .extend({
    applicationDeadline: z.iso.datetime(),
    skills: z.array(z.string()),
  });

const createJobPayloadSchema = createJobPayloadBaseSchema
  .refine((data) => data.country === "United States" && !data.state, {
    message: "State is required for United States",
    path: ["state"],
  })
  .refine((data) => data.country === "United States" && !data.zipcode, {
    message: "Zip Code is required for United States",
  });

const jobIdParamSchema = z.object({
  jobId: z.string().regex(/^\d+$/, "jobId must be a valid number"),
});

export const createJobSchema = z.object({
  body: createJobPayloadSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

// Update job schema: use base payload schema, apply partial FIRST, then add refinements
export const updateJobSchema = z.object({
  body: createJobPayloadBaseSchema
    .partial()
    .refine(
      (data) => {
        // Only validate if country is provided and is "United States"
        if (data.country === "United States") {
          return !!data.state && !!data.zipcode;
        }
        return true;
      },
      {
        message: "State and Zip Code are required for United States",
      },
    ),
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
export type JobSkills = z.infer<typeof selectJobSkillsSchema>;
export type JobInsight = z.infer<typeof selectJobInsightsSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobInputSchema>;
export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type NewJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateJobApplicationSchema>;
export type UpdateJobInsights = z.infer<typeof updateJobInsightsSchema>;
export type JobWithEmployer = {
  hasApplied: boolean;
  job: Job;
  employer: Pick<
    Organization,
    "id" | "name" | "city" | "state" | "logoUrl"
  > | null;
};
export type JobWithSkills = Job & {
  skills: JobSkills["name"][];
  employer: { name: string };
};
export type CreateJobSchema = z.infer<typeof createJobSchema>;
export type GetJobSchema = z.infer<typeof getJobSchema>;
export type UpdateJobSchema = z.infer<typeof updateJobSchema>;
export type DeleteJobSchema = z.infer<typeof deleteJobSchema>;
