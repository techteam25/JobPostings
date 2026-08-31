export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "hired"
  | "withdrawn";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Submitted",
  reviewed: "Under Review",
  shortlisted: "Shortlisted",
  interviewing: "Interview Scheduled",
  rejected: "Not Selected",
  hired: "Offer Extended / Hired",
  withdrawn: "Withdrawn",
} as const;

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status as ApplicationStatus] || status;
}
