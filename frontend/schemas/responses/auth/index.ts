import { z } from "zod";

const authTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
  refreshExpiresAt: z.date(),
});

const userSchema = z.object({
  id: z.int().positive(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["user", "employer"]),
  organizationId: z.int().positive().optional(),
  isEmailVerified: z.boolean(),
  isActive: z.boolean(),
  lastLoginAt: z.iso.date().optional(),
  createdAt: z.iso.date().optional(),
  updatedAt: z.iso.date().optional(),
});

export const registrationResponseSchema = z
  .object({
    token: z.string().nullable(),
    user: z.object({
      id: z.coerce.number(),
      email: z.email(),
      name: z.string(),
      image: z.string().nullable().optional(),
      emailVerified: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  })
  .nullable();

export type AuthTokens = z.infer<typeof authTokens>;
export type User = z.infer<typeof userSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
