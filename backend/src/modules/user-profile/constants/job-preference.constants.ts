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

export const WORK_ARRANGEMENTS = ["remote", "hybrid", "in_person"] as const;

export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const WorkArrangement = {
  Remote: "remote",
  Hybrid: "hybrid",
  InPerson: "in_person",
} as const satisfies Record<string, WorkArrangement>;

export const COMMUTE_TIMES = [
  "up_to_15_minutes",
  "up_to_30_minutes",
  "up_to_45_minutes",
  "up_to_60_minutes",
  "up_to_90_minutes_or_more",
] as const;

export type CommuteTime = (typeof COMMUTE_TIMES)[number];

export const CommuteTime = {
  UpTo15Minutes: "up_to_15_minutes",
  UpTo30Minutes: "up_to_30_minutes",
  UpTo45Minutes: "up_to_45_minutes",
  UpTo60Minutes: "up_to_60_minutes",
  UpTo90MinutesOrMore: "up_to_90_minutes_or_more",
} as const satisfies Record<string, CommuteTime>;

export const WILLINGNESS_TO_RELOCATE = [
  "willing_anywhere",
  "willing_domestically",
  "willing_specific_regions",
  "not_willing",
] as const;

export type WillingnessToRelocate = (typeof WILLINGNESS_TO_RELOCATE)[number];

export const WillingnessToRelocate = {
  WillingAnywhere: "willing_anywhere",
  WillingDomestically: "willing_domestically",
  WillingSpecificRegions: "willing_specific_regions",
  NotWilling: "not_willing",
} as const satisfies Record<string, WillingnessToRelocate>;
