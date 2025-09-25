import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim().optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim().optional(),
  email: z.string().email('Invalid email format').toLowerCase().optional(),
  role: z.enum(['user', 'employer', 'admin']).optional(),
  organizationId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  profilePicture: z.string().url('Invalid profile picture URL').optional(),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(1000).optional(),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  portfolioUrl: z.string().url('Invalid portfolio URL').optional(),
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional(),
  address: z.string().min(5, 'Address must be at least 5 characters').max(255).optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100).optional(),
  state: z.string().min(2, 'State must be at least 2 characters').max(100).optional(),
  zipCode: z.string()
    .min(5, 'Zip code must be at least 5 characters')
    .max(10, 'Zip code must not exceed 10 characters')
    .optional(),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100).optional(),
});

export const userParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'Invalid user ID format')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'User ID must be positive'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const getUsersQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val > 0, 'Page must be positive'),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 10)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string().optional(),
  role: z.enum(['user', 'employer', 'admin']).optional(),
});