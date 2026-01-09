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
});

export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

// Implement backend validation requiring search_query OR at least one filter criterion (location, skills, employment type, etc.)
export const jobAlertValidationSchema = insertJobAlertSchema.refine(
  (data: InsertJobAlert) => {
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

// Schema for job alert matches
export const insertJobAlertMatchSchema = createInsertSchema(jobAlertMatches, {
  jobAlertId: z.number().int().positive("Job Alert ID is required"),
  jobId: z.number().int().positive("Job ID is required"),
});
export type InsertJobAlertMatch = z.infer<typeof insertJobAlertMatchSchema>;

// Select schemas
export const selectJobAlertSchema = createSelectSchema(jobAlerts);
export const selectJobAlertMatchSchema = createSelectSchema(jobAlertMatches);
