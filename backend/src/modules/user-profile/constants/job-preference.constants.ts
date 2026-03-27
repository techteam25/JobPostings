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
