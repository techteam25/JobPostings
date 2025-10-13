import { z } from "@/swagger/registry";
import {
  insertEducationsSchema,
  insertUserProfileSchema,
  insertWorkExperiencesSchema,
  selectEducationsSchema,
  selectUserProfileSchema,
  selectWorkExperiencesSchema,
  updateEducationsSchema,
  updateUserProfileSchema,
  updateWorkExperiencesSchema,
} from "@/db/schema";

const idParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid work experience ID format"),
});

export const idPayloadParamsSchema = z.object({
  params: idParamsSchema,
  body: z.object({}).strict(),
  query: z.object({}).strict(),
});

// Work Experience Schemas
export const workExperienceGetSchema = z.object({
  body: selectWorkExperiencesSchema.array(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const workExperienceCreateSchema = z.object({
  body: insertWorkExperiencesSchema.array(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const workExperienceUpdateSchema = z.object({
  body: updateWorkExperiencesSchema.array(),
  params: idParamsSchema,
  query: z.object({}).strict(),
});

// Education Schemas
export const educationsGetSchema = z.object({
  body: selectEducationsSchema.array(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const educationsCreateSchema = z.object({
  body: insertEducationsSchema.array(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const educationsUpdateSchema = z.object({
  body: updateEducationsSchema.array(),
  params: idParamsSchema,
  query: z.object({}).strict(),
});

// User Profile Schemas
export const userProfileGetSchema = z.object({
  body: selectUserProfileSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userProfileCreateSchema = z.object({
  body: insertUserProfileSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userProfileUpdateSchema = z.object({
  body: updateUserProfileSchema,
  params: idParamsSchema,
  query: z.object({}).strict(),
});

// Combined User Profile Data Schema
export const completeUserProfileSchema = z.object({
  profile: selectUserProfileSchema,
  workExperiences: z.array(selectWorkExperiencesSchema),
  educations: z.array(selectEducationsSchema),
});

export type IdPayloadParamsInput = z.infer<typeof idPayloadParamsSchema>;

// Work Experience Type exports
export type WorkExperienceCreateInput = z.infer<
  typeof workExperienceCreateSchema
>;
export type WorkExperienceUpdateInput = z.infer<
  typeof workExperienceUpdateSchema
>;
export type WorkExperienceQueryInput = z.infer<typeof workExperienceGetSchema>;

// Education Type exports
export type EducationCreateInput = z.infer<typeof educationsCreateSchema>;
export type EducationUpdateInput = z.infer<typeof educationsUpdateSchema>;
export type EducationQueryInput = z.infer<typeof educationsGetSchema>;

// User Profile Type exports
export type UserProfileCreateInput = z.infer<typeof userProfileCreateSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type UserProfileQueryInput = z.infer<typeof userProfileGetSchema>;

// Complete User Profile Type export
export type CompleteUserProfile = z.infer<typeof completeUserProfileSchema>;
