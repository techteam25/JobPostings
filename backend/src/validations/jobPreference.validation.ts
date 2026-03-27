import { z } from "zod";

const jobTypesSchema = z
  .array(
    z.enum(["full-time", "part-time", "contract", "volunteer", "internship"]),
  )
  .min(1, "At least one job type is required")
  .refine((items) => new Set(items).size === items.length, {
    message: "Job types must not contain duplicates",
  });

const compensationTypesSchema = z
  .array(z.enum(["paid", "missionary", "volunteer", "stipend"]))
  .min(1, "At least one compensation type is required")
  .refine((items) => new Set(items).size === items.length, {
    message: "Compensation types must not contain duplicates",
  });

const volunteerHoursPerWeekSchema = z.enum(
  [
    "less_than_10_hours",
    "10-20_hours",
    "20-30_hours",
    "30-40_hours",
    "over_40_hours",
  ],
  { message: "Invalid volunteer hours per week value" },
);

export const insertJobPreferenceSchema = z
  .object({
    jobTypes: jobTypesSchema,
    compensationTypes: compensationTypesSchema,
    volunteerHoursPerWeek: volunteerHoursPerWeekSchema.optional(),
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
    jobTypes: jobTypesSchema.optional(),
    compensationTypes: compensationTypesSchema.optional(),
    volunteerHoursPerWeek: volunteerHoursPerWeekSchema.optional(),
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
