import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { organizationMembers, organizations } from "@/db/schema";

// Zod schemas for validation
export const selectOrganizationSchema = createSelectSchema(organizations);
export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(5, "Name must be at least 5 characters").max(100),
  url: z.url("Invalid organization website URL"),
  phone: z
    .string()
    .min(10, "Phone must be at least 20 characters")
    .max(20)
    .optional(),
});
export const updateOrganizationInputSchema = insertOrganizationSchema
  .partial()
  .omit({ id: true, createdAt: true });

const organizationIdParamSchema = z.object({
  organizationId: z.string().regex(/^\d+$/, "organizationId is required"),
});

export const createOrganizationSchema = z.object({
  body: insertOrganizationSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateOrganizationSchema = z.object({
  body: updateOrganizationInputSchema,
  params: organizationIdParamSchema,
  query: z.object({}).strict(),
});

export const getOrganizationSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: organizationIdParamSchema,
});

export const deleteOrganizationSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: organizationIdParamSchema,
});

export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type OrganizationMember = z.infer<typeof organizationMembers>;

export type GetOrganizationSchema = z.infer<typeof getOrganizationSchema>;
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationSchema = z.infer<typeof deleteOrganizationSchema>;
