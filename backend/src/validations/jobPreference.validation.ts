import { z } from "zod";

const jobTypeEnum = z.enum([
  "full-time",
  "part-time",
  "contract",
  "volunteer",
  "internship",
]);

const compensationTypeEnum = z.enum([
  "paid",
  "missionary",
  "volunteer",
  "stipend",
]);

const volunteerHoursPerWeekEnum = z.enum(
  [
    "less_than_10_hours",
    "10-20_hours",
    "20-30_hours",
    "30-40_hours",
    "over_40_hours",
  ],
  { message: "Invalid volunteer hours per week value" },
);

const noDuplicates = (items: string[]) => new Set(items).size === items.length;

export const insertJobPreferenceSchema = z
  .object({
    jobTypes: z
      .array(jobTypeEnum)
      .min(1, "At least one job type is required")
      .refine(noDuplicates, {
        message: "Job types must not contain duplicates",
      }),
    compensationTypes: z
      .array(compensationTypeEnum)
      .min(1, "At least one compensation type is required")
      .refine(noDuplicates, {
        message: "Compensation types must not contain duplicates",
      }),
    volunteerHoursPerWeek: volunteerHoursPerWeekEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.jobTypes.includes("volunteer")) {
        return data.volunteerHoursPerWeek !== undefined;
      }
      return true;
    },
    {
      message:
        "volunteerHoursPerWeek is required when job types include volunteer",
      path: ["volunteerHoursPerWeek"],
    },
  );

const patchBodySchema = z
  .object({
    jobTypes: z
      .array(jobTypeEnum)
      .refine(noDuplicates, {
        message: "Job types must not contain duplicates",
      })
      .optional(),
    compensationTypes: z
      .array(compensationTypeEnum)
      .refine(noDuplicates, {
        message: "Compensation types must not contain duplicates",
      })
      .optional(),
    volunteerHoursPerWeek: volunteerHoursPerWeekEnum.optional(),
  })
  .refine((data) => data.jobTypes || data.compensationTypes, {
    message: "At least one of jobTypes or compensationTypes must be provided",
  })
  .refine(
    (data) => {
      if (data.jobTypes?.includes("volunteer")) {
        return data.volunteerHoursPerWeek !== undefined;
      }
      return true;
    },
    {
      message:
        "volunteerHoursPerWeek is required when job types include volunteer",
      path: ["volunteerHoursPerWeek"],
    },
  );

export const patchJobPreferenceSchema = z.object({
  body: patchBodySchema,
  params: z.object({}),
  query: z.object({}),
});

export type PatchJobPreferenceBody = z.infer<typeof patchBodySchema>;
