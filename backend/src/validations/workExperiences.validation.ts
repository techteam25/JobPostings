// Zod schemas for validation
import { z } from "zod";

import { workExperiences } from "@/db/schema";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const selectWorkExperiencesSchema = createSelectSchema(workExperiences);
export const insertWorkExperiencesSchema = createInsertSchema(workExperiences, {
  companyName: z.string().min(1, "Company name is required").max(100),
  jobTitle: z.string().min(1, "Job title is required").max(100),
  description: z.string().optional(),
  current: z.boolean().default(false),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
});
export const updateWorkExperiencesSchema = createUpdateSchema(workExperiences, {
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100)
    .optional(),
  jobTitle: z.string().min(1, "Job title is required").max(100).optional(),
  description: z.string().optional(),
  current: z.boolean().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
}).omit({ userProfileId: true });

// Route-level validation schemas
const workExperienceParamsSchema = z.object({
  workExperienceId: z
    .string()
    .regex(/^\d+$/, "Invalid work experience ID format"),
});

export const batchCreateWorkExperiencesSchema = z.object({
  body: z.object({
    workExperiences: z
      .array(insertWorkExperiencesSchema.omit({ userProfileId: true }))
      .min(1, "At least one work experience entry is required")
      .max(10, "Maximum 10 work experience entries per request"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateWorkExperienceRouteSchema = z.object({
  body: updateWorkExperiencesSchema,
  params: workExperienceParamsSchema,
  query: z.object({}),
});

export const deleteWorkExperienceRouteSchema = z.object({
  body: z.object({}),
  params: workExperienceParamsSchema,
  query: z.object({}),
});

// Type exports
export type WorkExperience = z.infer<typeof selectWorkExperiencesSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperiencesSchema>;
export type InsertWorkExperience = z.infer<typeof insertWorkExperiencesSchema>;
export type BatchCreateWorkExperiencesInput = z.infer<
  typeof batchCreateWorkExperiencesSchema
>;
export type UpdateWorkExperienceRouteInput = z.infer<
  typeof updateWorkExperienceRouteSchema
>;
export type DeleteWorkExperienceRouteInput = z.infer<
  typeof deleteWorkExperienceRouteSchema
>;
