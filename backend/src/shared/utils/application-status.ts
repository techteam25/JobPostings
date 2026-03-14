/**
 * Application status constants and utilities for human-readable display.
 * This file provides mappings and helper functions for application status values.
 */

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "hired"
  | "withdrawn";

/**
 * Map of application status values to their human-readable labels.
 * Use this for displaying status values to users in the UI, emails, or other user-facing contexts.
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Submitted",
  reviewed: "Under Review",
  shortlisted: "Shortlisted",
  interviewing: "Interview Scheduled",
  rejected: "Not Selected",
  hired: "Offer Extended / Hired",
  withdrawn: "Withdrawn",
} as const;

/**
 * Gets the human-readable label for an application status.
 * @param status The application status value.
 * @returns The human-readable label for the status, or the original status if not found.
 */
export function getApplicationStatusLabel(
  status: string,
): string {
  return (
    APPLICATION_STATUS_LABELS[status as ApplicationStatus] || status
  );
}

/**
 * Array of all valid application status values.
 * Useful for validation, dropdowns, or iteration.
 */
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "pending",
  "reviewed",
  "shortlisted",
  "interviewing",
  "rejected",
  "hired",
  "withdrawn",
] as const;

