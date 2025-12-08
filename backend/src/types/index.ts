// API Response types

import { z } from "zod";

const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  timestamp: z.string().optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  status: z.literal("error"),
  message: z.string(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const paginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  timestamp: z.string().optional(),
  pagination: paginationMetaSchema,
});

const authTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
  refreshExpiresAt: z.date(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  });

export const apiPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.array(),
    pagination: paginationMetaSchema,
  });

/* API Response Types */

export type ApiResponse<T> =
  | (T extends void
      ? z.infer<typeof successResponseSchema>
      : z.infer<typeof successResponseSchema> & { data: T })
  | z.infer<typeof errorResponseSchema>;

export type PaginatedResponse<T> =
  | (T extends void
      ? z.infer<typeof paginatedResponseSchema>
      : z.infer<typeof paginatedResponseSchema> & { data: T })
  | z.infer<typeof errorResponseSchema>;

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type AuthTokens = z.infer<typeof authTokens>;
