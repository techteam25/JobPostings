import { z } from "@/swagger/registry";
import {
  insertCertificationsSchema,
  insertEducationsSchema,
  insertUserProfileSchema,
  insertWorkExperiencesSchema,
  selectCertificationsSchema,
  selectEducationsSchema,
  selectUserProfileSchema,
  selectWorkExperiencesSchema,
  updateCertificationsSchema,
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

// User Certifications Schemas
export const userCertificationsCreateSchema = z.object({
  body: insertCertificationsSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userCertificationsUpdateSchema = z.object({
  body: updateCertificationsSchema,
  params: idParamsSchema,
  query: z.object({}).strict(),
});

// Combined User Profile Data Schema
export const completeUserProfileSchema = z.object({
  profile: selectUserProfileSchema,
  workExperiences: z.array(selectWorkExperiencesSchema),
  educations: z.array(selectEducationsSchema),
  certifications: z.array(selectCertificationsSchema),
});

export type IdPayloadParamsInput = z.infer<typeof idPayloadParamsSchema>;

// Work Experience Type exports
export type WorkExperienceCreateInput = z.infer<
  typeof workExperienceCreateSchema
>;
export type WorkExperienceUpdateInput = z.infer<
  typeof workExperienceUpdateSchema
>;

// Education Type exports
export type EducationCreateInput = z.infer<typeof educationsCreateSchema>;
export type EducationUpdateInput = z.infer<typeof educationsUpdateSchema>;

// User Profile Type exports
export type UserProfileCreateInput = z.infer<typeof userProfileCreateSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

// User Certifications Type exports
export type UserCertificationsCreateInput = z.infer<
  typeof userCertificationsCreateSchema
>;
export type UserCertificationsUpdateInput = z.infer<
  typeof userCertificationsUpdateSchema
>;

// Complete User Profile Type export
export type CompleteUserProfile = z.infer<typeof completeUserProfileSchema>;
