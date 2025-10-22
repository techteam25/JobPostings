// Zod schemas for validation
import { z } from "zod";

import { educations } from "@/db/schema";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const selectEducationsSchema = createSelectSchema(educations);
export const insertEducationsSchema = createInsertSchema(educations, {
  schoolName: z.string().min(1, "School name is required").max(100),
  major: z.string().min(1, "Program major is required").max(100),
  graduated: z.boolean().default(false),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
});
export const updateEducationsSchema = createUpdateSchema(educations).omit({
  userProfileId: true,
});

// Type exports
export type Education = z.infer<typeof selectEducationsSchema>;
export type UpdateEducation = z.infer<typeof updateEducationsSchema>;
export type InsertEducation = z.infer<typeof insertEducationsSchema>;
