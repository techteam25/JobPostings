import { z } from "zod";

export const searchParams = z.object({
  body: z.object({}).strict(),
  query: z.object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default("10").transform(Number),
    sortBy: z.string().optional(),
    order: z
      .string()
      .optional()
      .refine(
        (val) => !val || ["asc", "desc"].includes(val),
        "Order must be either 'asc' or 'desc'",
      ),
  }),
  params: z.object({}).strict(),
});
