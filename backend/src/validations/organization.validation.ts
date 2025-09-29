import { z } from 'zod';

export const createOrganizationSchema = {
  body: z.object({
    name: z.string().min(5, 'Name must be at least 5 characters').max(100),
    streetAddress: z.string().min(1, 'Street address is required').max(100),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    zipCode: z.string().min(5, 'Zip code must be 5 digits').max(5),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional(),
    contact: z.number().positive('Contact ID is required'),
    url: z.string().url('Invalid organization website URL'),
    mission: z.string().min(1, 'Mission statement is required'),
  }),
};

export const updateOrganizationSchema = {
  body: z.object({
    name: z.string().min(5).max(100).optional(),
    streetAddress: z.string().min(1).max(100).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    zipCode: z.string().min(5).max(5).optional(),
    phone: z.string().min(10).max(15).optional(),
    url: z.string().url().optional(),
    mission: z.string().min(1).optional(),
  }),
};

export const organizationParamsSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid organization ID').transform(Number),
  }),
};
