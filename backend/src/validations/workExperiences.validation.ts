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
  current: z.boolean().default(false),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
});
export const updateWorkExperiencesSchema = createUpdateSchema(
  workExperiences,
).omit({ userProfileId: true });

// Type exports
export type WorkExperience = z.infer<typeof selectWorkExperiencesSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperiencesSchema>;
export type InsertWorkExperience = z.infer<typeof insertWorkExperiencesSchema>;
