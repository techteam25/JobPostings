import { z } from "zod";

const organizationPayloadSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters").max(100),
  streetAddress: z.string().min(1, "Street address is required").max(100),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zipCode: z.string().min(5, "Zip code must be 5 digits").max(5),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15)
    .optional(),
  contact: z.number().positive("Contact ID is required"),
  url: z.url("Invalid organization website URL"),
  mission: z.string().min(1, "Mission statement is required"),
});

const organizationIdParamSchema = z.object({
  organizationId: z.string().regex(/^\d+$/, "organizationId is required"),
});

export const createOrganizationSchema = z.object({
  body: organizationPayloadSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateOrganizationSchema = z.object({
  body: organizationPayloadSchema.partial(),
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

export type GetOrganizationSchema = z.infer<typeof getOrganizationSchema>;
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationSchema = z.infer<typeof deleteOrganizationSchema>;
