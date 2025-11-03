import { z } from "@/swagger/registry";
import {
  insertUserProfileSchema,
  updateUserProfileSchema,
} from "@/validations/userProfile.validation";

const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid user ID format"),
});

const userEmailSchema = z.object({
  email: z.email({ error: "Email is required" }),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
});

const getUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .refine((val) => val === undefined || parseInt(val) > 0, {
      message: "Page must be a positive integer",
    }),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .refine(
      (val) => val === undefined || (parseInt(val) > 0 && parseInt(val) <= 100),
      {
        message: "Limit must be a positive integer and at most 100",
      },
    ),
  searchTerm: z.string().optional(),
  role: z.enum(["user", "employer", "admin"]).optional(),
});

const savedJobsSchema = z.object({
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
  items: z
    .object({
      id: z.number(),
      savedAt: z.date(),
      isClosed: z.boolean(),
      isExpired: z.boolean(),
      job: z.object({
        id: z.number(),
        title: z.string(),
        city: z.string(),
        state: z.string().nullable(),
        country: z.string(),
        isActive: z.boolean(),
        compensationType: z.enum([
          "paid",
          "missionary",
          "volunteer",
          "stipend",
        ]),
        isRemote: z.boolean(),
        applicationDeadline: z.date().nullable(),
        jobType: z.enum([
          "full-time",
          "part-time",
          "contract",
          "volunteer",
          "internship",
        ]),
      }),
    })
    .array(),
});

export const getSavedJobsQuerySchema = z.object({
  page: getUsersQuerySchema.shape.page.default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default("20")
    .refine(
      (val) => val === undefined || (parseInt(val) > 0 && parseInt(val) <= 20),
      {
        message: "Limit must be a positive integer and at most 20",
      },
    ),
});

export const getUserSchema = z.object({
  body: z.object({}).strict(),
  params: userParamsSchema,
  query: z.object({}).strict(),
});

export const userQuerySchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: getUsersQuerySchema,
});

export const userEmailPayloadSchema = z.object({
  body: userEmailSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const changeUserPasswordSchema = z.object({
  body: changePasswordSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const createUserPayloadSchema = z.object({
  body: insertUserProfileSchema.omit({ userId: true }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateUserPayloadSchema = z.object({
  body: updateUserProfileSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  confirm: z
    .boolean()
    .optional()
    .refine((val) => val === true, { message: "You must confirm deletion" }), // Extra safeguard
});

const deleteUserTokenSchema = z.object({
  token: z.string().min(1, "Deletion token is required"),
});

export const deleteSelfSchema = z.object({
  body: deleteAccountSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const deleteUserSchema = z.object({
  body: deleteUserTokenSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const getUserSavedJobsQuerySchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: getSavedJobsQuerySchema,
});

export type GetUserSchema = z.infer<typeof getUserSchema>;
export type ChangePasswordSchema = z.infer<typeof changeUserPasswordSchema>;
export type UserEmailSchema = z.infer<typeof userEmailPayloadSchema>;
export type UserQuerySchema = z.infer<typeof userQuerySchema>;
export type CreateUserProfile = z.infer<typeof createUserPayloadSchema>;
export type DeleteSelfSchema = z.infer<typeof deleteSelfSchema>;
export type DeleteUserSchema = z.infer<typeof deleteUserSchema>;
export type SavedJobs = z.infer<typeof savedJobsSchema>;
export type SavedJobsQuerySchema = z.infer<typeof getUserSavedJobsQuerySchema>;
