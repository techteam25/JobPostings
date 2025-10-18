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

/* API Response Types */

export type ApiResponse<T> =
  | (T extends void
      ? z.infer<typeof successResponseSchema>
      : z.infer<typeof successResponseSchema> & { data: T })
  | z.infer<typeof errorResponseSchema>;
