import { z } from "zod";
import { updateUserSchema } from "@/db/schema";

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
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be positive"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  search: z.string().optional(),
  role: z.enum(["user", "employer", "admin"]).optional(),
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

export const updateUserPayloadSchema = z.object({
  body: updateUserSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type GetUserSchema = z.infer<typeof getUserSchema>;
export type ChangePasswordSchema = z.infer<typeof changeUserPasswordSchema>;
export type UserEmailSchema = z.infer<typeof userEmailPayloadSchema>;
