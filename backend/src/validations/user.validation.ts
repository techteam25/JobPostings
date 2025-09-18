import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  bio: z.string().min(10).max(500).optional(),
  resumeUrl: z.string().url().optional(),
  profilePicture: z.string().url().optional(),
});

export const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
});
