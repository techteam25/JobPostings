import { z } from "@/swagger/registry";
import { coerceQueryBool } from "@/validations/shared/coerce";

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
    // Zip/postal code is filtered separately from `location` so that
    // selecting a postcode suggestion in the frontend autocomplete matches
    // candidates whose indexed `location` field never includes a zip. Kept
    // short (max 20) to accommodate international formats without bloat.
    zipcode: z.string().max(20).optional(),
    minYearsExperience: z.coerce.number().int().min(0).max(50).optional(),
    openToWork: coerceQueryBool().optional(),
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

export const publicCandidateWorkExperienceSchema = z
  .object({
    jobTitle: z.string(),
    companyName: z.string(),
    description: z.string().nullable(),
    current: z.boolean(),
    startDate: z.string(),
    endDate: z.string().nullable(),
  })
  .openapi("PublicCandidateWorkExperience");

export const publicCandidateEducationSchema = z
  .object({
    schoolName: z.string(),
    major: z.string(),
    graduated: z.boolean(),
    startDate: z.string(),
    endDate: z.string().nullable(),
  })
  .openapi("PublicCandidateEducation");

export const publicCandidateProfileSchema = z
  .object({
    userId: z.number().int(),
    name: z.string(),
    photoUrl: z.string().nullable(),
    headline: z.string(),
    bio: z.string().nullable(),
    skills: z.array(z.string()),
    location: z.string(),
    yearsOfExperience: z.number().int(),
    openToWork: z.boolean(),
    workExperiences: z.array(publicCandidateWorkExperienceSchema),
    educations: z.array(publicCandidateEducationSchema),
    certifications: z.array(z.string()),
  })
  .openapi("PublicCandidateProfile");

export const getCandidateProfileSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: z.object({
    userId: z.string().regex(/^\d+$/, "Invalid candidate ID format"),
  }),
});

export type PublicCandidateProfile = z.infer<
  typeof publicCandidateProfileSchema
>;
export type GetCandidateProfileSchema = z.infer<
  typeof getCandidateProfileSchema
>;
