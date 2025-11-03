import { ValidationError } from "@/utils/errors";

type Status =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "hired"
  | "withdrawn";

export function statusRegressionGuard(
  currentStatus: Status,
  statusUpdateAttempt: Status,
) {
  const updateStatusProgressionMap = {
    pending: ["reviewed", "withdrawn"],
    reviewed: ["shortlisted", "rejected", "withdrawn"],
    shortlisted: ["interviewing", "rejected", "withdrawn"],
    interviewing: ["hired", "rejected", "withdrawn"],
    rejected: [] as string[],
    hired: [] as string[],
    withdrawn: [] as string[],
  };
  const allowedStatusTransitions = updateStatusProgressionMap[currentStatus];

  if (!allowedStatusTransitions.includes(statusUpdateAttempt)) {
    throw new ValidationError(
      `Invalid status transition from ${currentStatus} to ${statusUpdateAttempt}`,
    );
  }
  return statusUpdateAttempt;
}
