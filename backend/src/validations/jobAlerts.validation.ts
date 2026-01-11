import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jobAlerts, jobAlertMatches } from "@/db/schema";

// Schema for creating a new job alert
export const insertJobAlertSchema = createInsertSchema(jobAlerts, {
  userId: z.number().int().positive("User ID is required"),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100)
    .refine((val) => /^[a-zA-Z0-9\s\-]+$/.test(val)), // no special characters except spaces/hyphens
  frequency: z.enum(["daily", "weekly"]).default("weekly"),
  includeRemote: z.boolean().default(true),
});

export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

// Schema for job alert matches
export const insertJobAlertMatchSchema = createInsertSchema(jobAlertMatches, {
  jobAlertId: z.number().int().positive("Job Alert ID is required"),
  jobId: z.number().int().positive("Job ID is required"),
});
export type InsertJobAlertMatch = z.infer<typeof insertJobAlertMatchSchema>;

// Select schemas
export const selectJobAlertSchema = createSelectSchema(jobAlerts);
export const selectJobAlertMatchSchema = createSelectSchema(jobAlertMatches);

// Create job alert - body only (exclude userId, id, timestamps)
// Apply omit BEFORE refine to preserve custom validation
const createJobAlertBodySchema = insertJobAlertSchema
  .omit({
    userId: true,
    id: true,
    createdAt: true,
    updatedAt: true,
    lastSentAt: true,
  })
  .refine(
    (data) => {
      const hasSearchQuery =
        data.searchQuery && data.searchQuery.trim().length > 0;
      const hasLocation =
        (data.city && data.city.trim().length > 0) ||
        (data.state && data.state.trim().length > 0);

      const hasSkills = data.skills && data.skills.length > 0;
      const hasEmploymentTypes = data.jobType && data.jobType.length > 0;
      const hasExperienceLevels =
        data.experienceLevel && data.experienceLevel.length > 0;

      return (
        hasSearchQuery ||
        hasLocation ||
        hasSkills ||
        hasEmploymentTypes ||
        hasExperienceLevels
      );
    },
    {
      message:
        "At least one of search query, location, skills, experience level or employment types must be provided.",
    },
  );

export const createJobAlertSchema = z.object({
  body: createJobAlertBodySchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type CreateJobAlert = z.infer<typeof createJobAlertSchema>;

// Get job alerts query - pagination
export const getUserJobAlertsQuerySchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: z
    .object({
      page: z.coerce.number().min(1).optional().default(1),
      limit: z.coerce.number().min(1).max(50).optional().default(10),
    })
    .strict(),
});

export type GetUserJobAlertsQuery = z.infer<typeof getUserJobAlertsQuerySchema>;

// Get single job alert - params only
export const getJobAlertSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Alert ID must be a valid number"),
  }),
  query: z.object({}).strict(),
});

export type GetJobAlert = z.infer<typeof getJobAlertSchema>;

// Export types for use in services/controllers
export type JobAlert = z.infer<typeof selectJobAlertSchema>;
export type JobAlertMatch = z.infer<typeof selectJobAlertMatchSchema>;
export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>["body"];
