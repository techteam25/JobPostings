import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().transform(val => val.trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character',
    )
    .transform(val => val.trim()),
  firstName: z.string().min(1, 'First name is required').max(100).transform(val => val.trim()),
  lastName: z.string().min(1, 'Last name is required').max(100).transform(val => val.trim()),
  role: z.enum(['user', 'employer', 'admin']).default('user').transform(val => val.trim()),
  organizationId: z.number().int().positive().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().transform(val => val.trim()),
  password: z.string().min(1, 'Password is required').transform(val => val.trim()),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional().transform(val => val?.trim()),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').transform(val => val.trim()),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character',
    )
    .transform(val => val.trim()),
});