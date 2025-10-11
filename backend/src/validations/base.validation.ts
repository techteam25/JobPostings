import { z } from "zod";

export const searchParams = z.object({
  body: z.object({}).strict(),
  query: z.object({
    page: z.coerce.number().optional().default(1).transform(Number).optional(),
    limit: z.coerce
      .number()
      .optional()
      .default(10)
      .transform(Number)
      .optional(),
    q: z.string().optional(),
    jobType: z.string().optional(),
    location: z.string().optional(),
    isRemote: z.coerce.boolean().optional(),
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
