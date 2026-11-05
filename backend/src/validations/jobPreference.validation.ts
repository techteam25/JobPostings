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

const workScheduleDayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);

const scheduleTypeEnum = z.enum([
  "fixed",
  "flexible",
  "rotating",
  "seasonal_project_based",
  "on_call_as_needed",
]);

const workArrangementEnum = z.enum(["remote", "hybrid", "in_person"]);

const commuteTimeEnum = z.enum(
  [
    "up_to_15_minutes",
    "up_to_30_minutes",
    "up_to_45_minutes",
    "up_to_60_minutes",
    "up_to_90_minutes_or_more",
  ],
  { message: "Invalid commute time value" },
);

const willingnessToRelocateEnum = z.enum(
  [
    "willing_anywhere",
    "willing_domestically",
    "willing_specific_regions",
    "not_willing",
  ],
  { message: "Invalid willingness to relocate value" },
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
    workScheduleDays: z
      .array(workScheduleDayEnum)
      .refine(noDuplicates, {
        message: "Work schedule days must not contain duplicates",
      })
      .optional(),
    scheduleTypes: z
      .array(scheduleTypeEnum)
      .refine(noDuplicates, {
        message: "Schedule types must not contain duplicates",
      })
      .optional(),
    workArrangements: z
      .array(workArrangementEnum)
      .refine(noDuplicates, {
        message: "Work arrangements must not contain duplicates",
      })
      .optional(),
    commuteTime: commuteTimeEnum.optional(),
    willingnessToRelocate: willingnessToRelocateEnum.optional(),
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
    workScheduleDays: z
      .array(workScheduleDayEnum)
      .refine(noDuplicates, {
        message: "Work schedule days must not contain duplicates",
      })
      .optional(),
    scheduleTypes: z
      .array(scheduleTypeEnum)
      .refine(noDuplicates, {
        message: "Schedule types must not contain duplicates",
      })
      .optional(),
    workArrangements: z
      .array(workArrangementEnum)
      .refine(noDuplicates, {
        message: "Work arrangements must not contain duplicates",
      })
      .optional(),
    commuteTime: commuteTimeEnum.optional(),
    willingnessToRelocate: willingnessToRelocateEnum.optional(),
  })
  .refine(
    (data) =>
      data.jobTypes ||
      data.compensationTypes ||
      data.workScheduleDays ||
      data.scheduleTypes ||
      data.workArrangements ||
      data.commuteTime ||
      data.willingnessToRelocate,
    {
      message: "At least one preference field must be provided",
    },
  )
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
