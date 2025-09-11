import { 
  mysqlTable, 
  serial, 
  varchar, 
  timestamp, 
  mysqlEnum,
  text,
  boolean,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['user', 'employer', 'admin']).default('user').notNull(),
  profilePicture: varchar('profile_picture', { length: 500 }),
  bio: text('bio'),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  passwordHash: z.string().min(8, 'Password must be at least 8 characters'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  profilePicture: z.string().url('Invalid URL format').optional(),
});

export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = insertUserSchema.partial().omit({ id: true, createdAt: true });

// Public user schema (without sensitive data)
export const publicUserSchema = selectUserSchema.omit({
  passwordHash: true,
  isEmailVerified: true,
});

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
