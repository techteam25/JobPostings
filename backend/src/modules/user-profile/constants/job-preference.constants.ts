export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "volunteer",
  "internship",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const JobType = {
  FullTime: "full-time",
  PartTime: "part-time",
  Contract: "contract",
  Volunteer: "volunteer",
  Internship: "internship",
} as const satisfies Record<string, JobType>;

export const COMPENSATION_TYPES = [
  "paid",
  "missionary",
  "volunteer",
  "stipend",
] as const;

export type CompensationType = (typeof COMPENSATION_TYPES)[number];

export const CompensationType = {
  Paid: "paid",
  Missionary: "missionary",
  Volunteer: "volunteer",
  Stipend: "stipend",
} as const satisfies Record<string, CompensationType>;

export const VOLUNTEER_HOURS_PER_WEEK = [
  "less_than_10_hours",
  "10-20_hours",
  "20-30_hours",
  "30-40_hours",
  "over_40_hours",
] as const;

export type VolunteerHoursPerWeek = (typeof VOLUNTEER_HOURS_PER_WEEK)[number];

export const VolunteerHoursPerWeek = {
  LessThan10: "less_than_10_hours",
  TenToTwenty: "10-20_hours",
  TwentyToThirty: "20-30_hours",
  ThirtyToForty: "30-40_hours",
  OverForty: "over_40_hours",
} as const satisfies Record<string, VolunteerHoursPerWeek>;

export const WORK_SCHEDULE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type WorkScheduleDay = (typeof WORK_SCHEDULE_DAYS)[number];

export const WorkScheduleDay = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
} as const satisfies Record<string, WorkScheduleDay>;

export const SCHEDULE_TYPES = [
  "fixed",
  "flexible",
  "rotating",
  "seasonal_project_based",
  "on_call_as_needed",
] as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const ScheduleType = {
  Fixed: "fixed",
  Flexible: "flexible",
  Rotating: "rotating",
  SeasonalProjectBased: "seasonal_project_based",
  OnCallAsNeeded: "on_call_as_needed",
} as const satisfies Record<string, ScheduleType>;
