import { z } from "zod";

export const searchParams = z.object({
  body: z.object({}).strict(),
  query: z
    .object({
      page: z.coerce
        .number()
        .optional()
        .default(1)
        .transform(Number)
        .optional(),
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .transform(Number)
        .optional(),
      q: z.string().optional(),
      jobType: z
        .enum(["full-time", "part-time", "contract", "volunteer", "internship"])
        .array()
        .optional(),
      city: z.string().optional(),
      experience: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipcode: z.string().optional(),
      skills: z.string().array().optional(),
      includeRemote: z.coerce.boolean().optional(),
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
    })
    .strict(),
  params: z.object({}).strict(),
});

export const searchJobResult = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isRemote: z.boolean(),
  status: z.string(),
  experience: z.string().optional(),
  jobType: z.string(),
  skills: z.string().array(),
  createdAt: z.number(),
});

export type SearchParams = z.infer<typeof searchParams>;
export type JobDocumentType = z.infer<typeof searchJobResult>;
