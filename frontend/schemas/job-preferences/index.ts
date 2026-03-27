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

export const JOB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  JOB_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const COMPENSATION_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(COMPENSATION_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export const VOLUNTEER_HOURS_LABELS: Record<string, string> =
  Object.fromEntries(VOLUNTEER_HOURS_OPTIONS.map((o) => [o.value, o.label]));

const jobTypeValues = JOB_TYPE_OPTIONS.map((o) => o.value);
const compensationTypeValues = COMPENSATION_TYPE_OPTIONS.map((o) => o.value);
const volunteerHoursValues = VOLUNTEER_HOURS_OPTIONS.map((o) => o.value);

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

export type JobTypesFormData = z.infer<typeof jobTypesFormSchema>;
export type CompensationTypesFormData = z.infer<
  typeof compensationTypesFormSchema
>;

export interface JobPreference {
  id: number;
  userProfileId: number;
  jobTypes: string[];
  compensationTypes: string[];
  volunteerHoursPerWeek: string | null;
  createdAt: string;
  updatedAt: string;
}
