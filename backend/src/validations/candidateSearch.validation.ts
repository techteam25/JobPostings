import { z } from "zod";

export const candidateSearchQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

export const candidateSearchParams = z.object({
  query: candidateSearchQuerySchema,
});

export type CandidateSearchParams = z.infer<typeof candidateSearchQuerySchema>;

export const candidateSearchResult = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  emailVerified: z.boolean(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  profile: z.any().optional(), // Allow profile object through
});
