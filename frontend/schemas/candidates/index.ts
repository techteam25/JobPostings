import { z } from "zod";

export const candidatePreviewSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  headline: z.string(),
  skills: z.array(z.string()),
  location: z.string(),
  yearsOfExperience: z.number().int().nonnegative(),
  openToWork: z.boolean(),
});

export const candidateSortBySchema = z.enum([
  "relevant",
  "recent",
  "name",
  "yearsOfExperience",
]);

export const candidateSortOrderSchema = z.enum(["asc", "desc"]);

export const searchCandidatesRequestSchema = z.object({
  skills: z.array(z.string().min(1).max(100)).max(30).default([]),
  location: z.string().max(200).optional(),
  minYearsExperience: z.number().int().min(0).max(50).optional(),
  openToWork: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: candidateSortBySchema.default("relevant"),
  sortOrder: candidateSortOrderSchema.optional(),
});

export type SearchCandidatesRequest = z.infer<
  typeof searchCandidatesRequestSchema
>;
