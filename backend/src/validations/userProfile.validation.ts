import { z } from "@/swagger/registry";
import { user, userProfile } from "@/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  Certification,
  insertCertificationsSchema,
  selectCertificationsSchema,
  updateCertificationsSchema,
} from "@/validations/certifications.validation";
import {
  Education,
  insertEducationsSchema,
  selectEducationsSchema,
  updateEducationsSchema,
} from "@/validations/educations.validation";
import {
  insertWorkExperiencesSchema,
  selectWorkExperiencesSchema,
  updateWorkExperiencesSchema,
  WorkExperience,
} from "@/validations/workExperiences.validation";

// Zod schemas
export const insertUserSchema = createInsertSchema(user, {
  email: z.email("Invalid email format").toLowerCase(),
  fullName: z.string().min(1, "First name is required").max(100).trim(),
  status: z.enum(["active", "deactivated", "deleted"]).default("active"),
  deletedAt: z.date().optional(),
});

export const insertUserProfileSchema = createInsertSchema(userProfile, {
  userId: z.number().int().positive(),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(1000)
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
  linkedinUrl: z.url("Invalid LinkedIn URL").optional(),
  portfolioUrl: z.url("Invalid portfolio URL").optional(),
});

export const selectUserSchema = createSelectSchema(user);
export const selectUserProfileSchema = createSelectSchema(userProfile);

export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  createdAt: true,
  passwordHash: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateUserProfileSchema = insertUserProfileSchema
  .omit({ userId: true })
  .extend({
    educations: insertEducationsSchema
      .omit({ userProfileId: true })
      .array()
      .default([]),
    workExperiences: insertWorkExperiencesSchema
      .omit({ userProfileId: true })
      .array()
      .default([]),
    certifications: insertCertificationsSchema.array().default([]),
  });

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserProfile = z.infer<typeof selectUserProfileSchema>;
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Get type with relations
export type UserWithProfile = User & {
  profile:
    | (UserProfile & {
        certifications: { certification: Certification }[] | null;
        education: Education[] | null;
        workExperiences: WorkExperience[] | null;
      })
    | null;
};

const idParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid work experience ID format"),
});

const updateProfileVisibilitySchema = z.object({
  body: updateUserProfileSchema.pick({ isProfilePublic: true }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type UpdateProfileVisibilityInput = z.infer<
  typeof updateProfileVisibilitySchema
>;

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
