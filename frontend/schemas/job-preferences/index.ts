import { z } from "zod";

export const JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "volunteer", label: "Volunteer" },
  { value: "internship", label: "Internship" },
] as const;

export const COMPENSATION_TYPE_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "missionary", label: "Missionary" },
  { value: "volunteer", label: "Volunteer" },
  { value: "stipend", label: "Stipend" },
] as const;

export const VOLUNTEER_HOURS_OPTIONS = [
  { value: "less_than_10_hours", label: "Less than 10 hours" },
  { value: "10-20_hours", label: "10-20 hours" },
  { value: "20-30_hours", label: "20-30 hours" },
  { value: "30-40_hours", label: "30-40 hours" },
  { value: "over_40_hours", label: "Over 40 hours" },
] as const;

export const WORK_SCHEDULE_DAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
] as const;

export const SCHEDULE_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed Schedule" },
  { value: "flexible", label: "Flexible Schedule" },
  { value: "rotating", label: "Rotating Schedule" },
  { value: "seasonal_project_based", label: "Seasonal / Project-Based" },
  { value: "on_call_as_needed", label: "On-Call / As Needed" },
] as const;

export const WORK_ARRANGEMENT_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid Work" },
  { value: "in_person", label: "In-Person" },
] as const;

export const COMMUTE_TIME_OPTIONS = [
  { value: "up_to_15_minutes", label: "Up to 15 minutes" },
  { value: "up_to_30_minutes", label: "Up to 30 minutes" },
  { value: "up_to_45_minutes", label: "Up to 45 minutes" },
  { value: "up_to_60_minutes", label: "Up to 60 minutes" },
  { value: "up_to_90_minutes_or_more", label: "Up to 90 minutes or more" },
] as const;

export const WILLINGNESS_TO_RELOCATE_OPTIONS = [
  { value: "willing_anywhere", label: "Willing to relocate anywhere" },
  { value: "willing_domestically", label: "Willing to relocate domestically" },
  {
    value: "willing_specific_regions",
    label: "Willing to relocate to specific regions",
  },
  { value: "not_willing", label: "Not willing to relocate" },
] as const;

export const JOB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  JOB_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const COMPENSATION_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(COMPENSATION_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export const VOLUNTEER_HOURS_LABELS: Record<string, string> =
  Object.fromEntries(VOLUNTEER_HOURS_OPTIONS.map((o) => [o.value, o.label]));

export const WORK_SCHEDULE_DAY_LABELS: Record<string, string> =
  Object.fromEntries(WORK_SCHEDULE_DAY_OPTIONS.map((o) => [o.value, o.label]));

export const SCHEDULE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SCHEDULE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const WORK_ARRANGEMENT_LABELS: Record<string, string> =
  Object.fromEntries(WORK_ARRANGEMENT_OPTIONS.map((o) => [o.value, o.label]));

export const COMMUTE_TIME_LABELS: Record<string, string> = Object.fromEntries(
  COMMUTE_TIME_OPTIONS.map((o) => [o.value, o.label]),
);

export const WILLINGNESS_TO_RELOCATE_LABELS: Record<string, string> =
  Object.fromEntries(
    WILLINGNESS_TO_RELOCATE_OPTIONS.map((o) => [o.value, o.label]),
  );

const jobTypeValues = JOB_TYPE_OPTIONS.map((o) => o.value);
const compensationTypeValues = COMPENSATION_TYPE_OPTIONS.map((o) => o.value);
const volunteerHoursValues = VOLUNTEER_HOURS_OPTIONS.map((o) => o.value);
const workScheduleDayValues = WORK_SCHEDULE_DAY_OPTIONS.map((o) => o.value);
const scheduleTypeValues = SCHEDULE_TYPE_OPTIONS.map((o) => o.value);
const workArrangementValues = WORK_ARRANGEMENT_OPTIONS.map((o) => o.value);
const commuteTimeValues = COMMUTE_TIME_OPTIONS.map((o) => o.value);
const willingnessToRelocateValues = WILLINGNESS_TO_RELOCATE_OPTIONS.map(
  (o) => o.value,
);

export const jobTypesFormSchema = z.object({
  jobTypes: z
    .array(z.enum(jobTypeValues))
    .min(1, "Select at least one job type"),
  volunteerHoursPerWeek: z.enum(volunteerHoursValues).optional(),
});

export const compensationTypesFormSchema = z.object({
  compensationTypes: z
    .array(z.enum(compensationTypeValues))
    .min(1, "Select at least one compensation type"),
});

export const workScheduleFormSchema = z.object({
  workScheduleDays: z.array(z.enum(workScheduleDayValues)),
  scheduleTypes: z.array(z.enum(scheduleTypeValues)),
});

export const workArrangementFormSchema = z.object({
  workArrangements: z.array(z.enum(workArrangementValues)),
});

export const commuteTimeFormSchema = z.object({
  commuteTime: z.enum(commuteTimeValues).nullable(),
});

export const relocationFormSchema = z.object({
  willingnessToRelocate: z.enum(willingnessToRelocateValues).nullable(),
});

export type JobTypesFormData = z.infer<typeof jobTypesFormSchema>;
export type CompensationTypesFormData = z.infer<
  typeof compensationTypesFormSchema
>;
export type WorkScheduleFormData = z.infer<typeof workScheduleFormSchema>;
export type WorkArrangementFormData = z.infer<typeof workArrangementFormSchema>;
export type CommuteTimeFormData = z.infer<typeof commuteTimeFormSchema>;
export type RelocationFormData = z.infer<typeof relocationFormSchema>;

export const workAreasFormSchema = z.object({
  workAreaIds: z.array(z.number()),
});

export type WorkAreasFormData = z.infer<typeof workAreasFormSchema>;

export interface WorkArea {
  id: number;
  name: string;
}

export interface JobPreference {
  id: number;
  userProfileId: number;
  jobTypes: string[];
  compensationTypes: string[];
  volunteerHoursPerWeek: string | null;
  workScheduleDays: string[] | null;
  scheduleTypes: string[] | null;
  workArrangements: string[] | null;
  commuteTime: string | null;
  willingnessToRelocate: string | null;
  workAreas: WorkArea[] | null;
  createdAt: string;
  updatedAt: string;
}
