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
export const updateEducationsSchema = createUpdateSchema(educations, {
  schoolName: z.string().min(1, "School name is required").max(100).optional(),
  major: z.string().min(1, "Program major is required").max(100).optional(),
  graduated: z.boolean().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
}).omit({
  userProfileId: true,
});

// Route-level validation schemas
const educationParamsSchema = z.object({
  educationId: z.string().regex(/^\d+$/, "Invalid education ID format"),
});

export const batchCreateEducationsSchema = z.object({
  body: z.object({
    educations: z
      .array(insertEducationsSchema.omit({ userProfileId: true }))
      .min(1, "At least one education entry is required")
      .max(10, "Maximum 10 education entries per request"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateEducationRouteSchema = z.object({
  body: updateEducationsSchema,
  params: educationParamsSchema,
  query: z.object({}),
});

export const deleteEducationRouteSchema = z.object({
  body: z.object({}),
  params: educationParamsSchema,
  query: z.object({}),
});

// Type exports
export type Education = z.infer<typeof selectEducationsSchema>;
export type UpdateEducation = z.infer<typeof updateEducationsSchema>;
export type InsertEducation = z.infer<typeof insertEducationsSchema>;
export type BatchCreateEducationsInput = z.infer<
  typeof batchCreateEducationsSchema
>;
export type UpdateEducationRouteInput = z.infer<
  typeof updateEducationRouteSchema
>;
export type DeleteEducationRouteInput = z.infer<
  typeof deleteEducationRouteSchema
>;
