import { z } from "zod";

export const searchParams = z.object({
  body: z.object({}).strict(),
  query: z.object({
    page: z.string().optional().default("1").transform(Number).optional(),
    limit: z.string().optional().default("10").transform(Number).optional(),
    sortBy: z.string().optional(),
    status: z
      .enum([
        "pending",
        "reviewed",
        "shortlisted",
        "interviewing",
        "rejected",
        "hired",
        "withdrawn",
      ])
      .optional(),
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

export type SearchParams = z.infer<typeof searchParams>;
