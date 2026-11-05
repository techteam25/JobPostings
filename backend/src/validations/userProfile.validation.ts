import { z } from "@/swagger/registry";
import { user, userProfile } from "@/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  Certification,
  insertCertificationsSchema,
} from "@/validations/certifications.validation";
import {
  Education,
  insertEducationsSchema,
} from "@/validations/educations.validation";
import {
  insertWorkExperiencesSchema,
  WorkExperience,
} from "@/validations/workExperiences.validation";
import type { Skill } from "@/validations/skills.validation";
import { isPossiblePhoneNumber } from "libphonenumber-js";

const URL_PROTOCOL_REGEX = /^https?:\/\//i;
const URL_PROTOCOL_ONLY_REGEX = /^https?:\/\/$/i;
function normalizeUrl(input: unknown): string {
  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return "";
  if (URL_PROTOCOL_ONLY_REGEX.test(trimmed)) return "";
  return URL_PROTOCOL_REGEX.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const optionalNormalizedUrl = (message: string) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const normalized = normalizeUrl(v);
      return normalized === "" ? undefined : normalized;
    })
    .pipe(z.string().url(message).optional());

/**
 * Strips HTML tags from a string and returns the plain-text content.
 * Used to validate bio length against the actual text the user typed,
 * since TipTap outputs HTML.
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

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
  resumeUrl: optionalNormalizedUrl("Invalid resume URL"),
  linkedinUrl: optionalNormalizedUrl("Invalid LinkedIn URL"),
  portfolioUrl: optionalNormalizedUrl("Invalid portfolio URL"),
});

export const selectUserSchema = createSelectSchema(user);
export const selectUserProfileSchema = createSelectSchema(userProfile);

export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

/**
 * Base schema without refinements — used for .pick() operations
 * (e.g., visibility and availability sub-schemas).
 */
const updateUserProfileBaseSchema = insertUserProfileSchema
  .omit({ userId: true })
  .extend({
    fullName: z
      .string()
      .min(1, "Display name is required")
      .max(100)
      .trim()
      .optional(),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
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

/**
 * Full update schema with refinements for bio (HTML-stripped length)
 * and phoneNumber (libphonenumber-js validation).
 */
export const updateUserProfileSchema = updateUserProfileBaseSchema
  .refine(
    (data) => {
      if (!data.bio) return true;
      return stripHtmlTags(data.bio).length >= 10;
    },
    { message: "Bio must be at least 10 characters", path: ["bio"] },
  )
  .refine(
    (data) => {
      if (!data.bio) return true;
      return stripHtmlTags(data.bio).length <= 1000;
    },
    { message: "Bio must not exceed 1000 characters", path: ["bio"] },
  )
  .refine(
    (data) => {
      if (!data.phoneNumber) return true;
      return isPossiblePhoneNumber(data.phoneNumber, "US");
    },
    { message: "Invalid phone number", path: ["phoneNumber"] },
  );

// Type exports
export type User = z.infer<typeof selectUserSchema>;
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
        skills: { skill: Skill }[] | null;
      })
    | null;
};

export const updateProfileVisibilitySchema = z.object({
  body: updateUserProfileBaseSchema.pick({ isProfilePublic: true }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type UpdateProfileVisibilityInput = z.infer<
  typeof updateProfileVisibilitySchema
>;

export const updateWorkAvailabilitySchema = z.object({
  body: updateUserProfileBaseSchema.pick({ isAvailableForWork: true }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type UpdateWorkAvailabilityInput = z.infer<
  typeof updateWorkAvailabilitySchema
>;

// ─── Profile Picture Upload ─────────────────────────────────────────

const profilePictureFileSchema = z.object({
  profilePicture: z
    .custom<Express.Multer.File>(
      (val) =>
        val != null &&
        typeof val === "object" &&
        "mimetype" in val &&
        "size" in val,
      {
        message: "Expected a valid Multer file",
      },
    )
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Profile picture image file (max size 5MB)",
    }),
});

export const uploadProfilePictureSchema = z.object({
  body: profilePictureFileSchema
    .refine(
      (data) => {
        if (data.profilePicture) {
          return data.profilePicture.mimetype.startsWith("image/");
        }
        return true;
      },
      {
        message: "File must be an image",
        path: ["profilePicture", "mimetype"],
      },
    )
    .refine(
      (data) => {
        if (data.profilePicture) {
          return data.profilePicture.size <= 5 * 1024 * 1024;
        }
        return true;
      },
      {
        message: "File size must be under 5MB",
        path: ["profilePicture", "size"],
      },
    ),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type UploadProfilePictureSchema = z.infer<
  typeof uploadProfilePictureSchema
>;

const ALLOWED_RESUME_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const resumeFileSchema = z.object({
  resume: z
    .custom<Express.Multer.File>(
      (val) =>
        val != null &&
        typeof val === "object" &&
        "mimetype" in val &&
        "size" in val,
      {
        message: "Expected a valid Multer file",
      },
    )
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Resume file — PDF or Word document (max 10 MB)",
    }),
});

export const uploadResumeSchema = z.object({
  body: resumeFileSchema
    .refine(
      (data) => {
        if (data.resume) {
          return ALLOWED_RESUME_MIMES.includes(data.resume.mimetype);
        }
        return true;
      },
      {
        message: "File must be a PDF or Word document (.pdf, .doc, .docx)",
        path: ["resume", "mimetype"],
      },
    )
    .refine(
      (data) => {
        if (data.resume) {
          return data.resume.size <= 10 * 1024 * 1024;
        }
        return true;
      },
      {
        message: "File size must be under 10 MB",
        path: ["resume", "size"],
      },
    ),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type UploadResumeSchema = z.infer<typeof uploadResumeSchema>;
