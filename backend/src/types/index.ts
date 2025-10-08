// API Response types

import { z } from "zod";

const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  timestamp: z.string().optional(),
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  status: z.literal("error"),
  message: z.string(),
  error: z.string().optional(),
  timestamp: z.string(),
});

const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const paginationParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  successResponseSchema.extend({
    data: dataSchema,
    pagination: paginationMetaSchema,
  });

const authTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
  refreshExpiresAt: z.date(),
});

/* API Response Types */
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type ApiResponse<T> =
  | (T extends void
      ? z.infer<typeof successResponseSchema>
      : z.infer<typeof successResponseSchema> & { data: T })
  | z.infer<typeof errorResponseSchema>;

export type PaginatedResponse<T> = z.infer<
  ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>
>;
export type PaginationParamsSchema = z.infer<typeof paginationParamsSchema>;

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type AuthTokens = z.infer<typeof authTokens>;
