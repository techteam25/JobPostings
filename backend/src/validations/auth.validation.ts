import { z } from "zod";

const REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

const registerSchema = z.object({
  email: z.email("Invalid email format").transform((val) => val.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      REGEX,
      "Password must contain uppercase, lowercase, number, and special character",
    )
    .transform((val) => val.trim()),
  firstName: z.string().min(1, "First name is required").max(100).nonempty(),
  lastName: z.string().min(1, "Last name is required").max(100).nonempty(),
  role: z.enum(["user", "employer", "admin"]).default("user"),
  organizationId: z.number().int().positive().optional(),
});

const loginSchema = z.object({
  email: z.email("Invalid email format").nonempty(),
  password: z.string().min(1, "Password is required").nonempty(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").nonempty(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      REGEX,
      "Password must contain uppercase, lowercase, number, and special character",
    )
    .nonempty(),
});

export const registerUserSchema = z.object({
  body: registerSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userRefreshTokenSchema = z.object({
  body: refreshTokenSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userLoginSchema = z.object({
  body: loginSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const changeUserPasswordSchema = z.object({
  body: changePasswordSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});
