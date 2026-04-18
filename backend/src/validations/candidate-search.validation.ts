import { z } from "@/swagger/registry";

const toArray = (val: string | string[]): string[] =>
  Array.isArray(val) ? val : [val];

export const candidatePreviewSchema = z
  .object({
    userId: z.number().int(),
    name: z.string(),
    photoUrl: z.string().nullable(),
    headline: z.string(),
    skills: z.array(z.string()),
    location: z.string(),
    yearsOfExperience: z.number().int(),
    openToWork: z.boolean(),
  })
  .openapi("CandidatePreview");

export const searchCandidatesQuerySchema = z
  .object({
    skills: z
      .union([z.string(), z.array(z.string())])
      .transform(toArray)
      .pipe(z.array(z.string().min(1).max(100)).max(30))
      .optional()
      .default([]),
    location: z.string().max(200).optional(),
    minYearsExperience: z.coerce.number().int().min(0).max(50).optional(),
    openToWork: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum(["relevant", "recent", "name", "yearsOfExperience"])
      .default("relevant"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  })
  .strict()
  .openapi("SearchCandidatesQuery");

export const searchCandidatesSchema = z.object({
  body: z.object({}).strict(),
  query: searchCandidatesQuerySchema,
  params: z.object({}).strict(),
});

export type SearchCandidatesSchema = z.infer<typeof searchCandidatesSchema>;
export type CandidatePreview = z.infer<typeof candidatePreviewSchema>;
