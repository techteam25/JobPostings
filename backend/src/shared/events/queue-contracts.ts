/**
 * Typed contracts for all BullMQ queue job payloads.
 *
 * These interfaces define the data shapes that flow between job producers
 * (modules that call `queueService.addJob()`) and consumers (workers).
 * Both sides should import from this file to keep payloads in sync.
 *
 * Convention:
 * - Each queue has a union type mapping job names → payload shapes
 * - Job names are string literals, not enums (matches BullMQ's API)
 * - Domain events use a separate system (see ./event-types.ts)
 */

// ─── Email Queue ─────────────────────────────────────────────────────

export interface EmailJobPayloads {
  sendPasswordChangedEmail: {
    userId: number;
    email: string;
    fullName: string;
  };
  sendAccountDeactivationConfirmation: {
    userId: number;
    email: string;
    fullName: string;
  };
  sendAccountDeletionConfirmation: {
    userId: number;
    email: string;
    fullName: string;
  };
  sendJobApplicationConfirmation: {
    userId: number;
    email: string;
    fullName: string;
    jobTitle: string;
    jobId: number;
  };
  sendApplicationWithdrawalConfirmation: {
    userId: number;
    email: string;
    fullName: string;
    jobTitle: string;
    applicationId: number;
  };
  sendApplicationStatusUpdate: {
    email: string;
    fullName: string;
    jobTitle: string;
    oldStatus: string;
    newStatus: string;
    applicationId: number;
  };
  sendJobDeletionEmail: {
    userId: number;
    email: string;
    fullName: string;
    jobTitle: string;
    jobId: number;
  };
  sendOrganizationInvitation: {
    userId: number;
    email: string;
    organizationName: string;
    inviterName: string;
    role: string;
    token: string;
    expirationDate: string;
  };
  sendOrganizationWelcome: {
    userId: number;
    email: string;
    name: string;
    organizationName: string;
    role: string;
  };
}

/** Any email job name */
export type EmailJobName = keyof EmailJobPayloads;

// ─── Typesense Queue ─────────────────────────────────────────────────

export interface TypesenseJobPayloads {
  indexJob: Record<string, unknown>;
  updateJobIndex: { id: number; updatedJob: Record<string, unknown> };
  deleteJobIndex: { id: number };
}

export type TypesenseJobName = keyof TypesenseJobPayloads;

// ─── File Upload Queue ───────────────────────────────────────────────

export interface FileUploadTempFile {
  originalname: string;
  tempPath: string;
  size: number;
  mimetype: string;
  fieldName: string;
}

export interface FileUploadJobPayloads {
  uploadFile: {
    entityType: string;
    entityId: string;
    folder: string;
    mergeWithExisting: boolean;
    tempFiles: FileUploadTempFile[];
    userId: string;
    correlationId: string;
  };
}

export type FileUploadJobName = keyof FileUploadJobPayloads;

// ─── Job Alert Queue ─────────────────────────────────────────────────

export interface JobAlertJobPayloads {
  "daily-job-alerts": { frequency: "daily" };
  "weekly-job-alerts": { frequency: "weekly" };
  "monthly-job-alerts": { frequency: "monthly" };
  "pause-inactive-user-alerts": Record<string, never>;
}

export type JobAlertJobName = keyof JobAlertJobPayloads;

// ─── Scheduled / Maintenance Queues ──────────────────────────────────

export interface TempFileCleanupJobPayloads {
  cleanupTempFiles: Record<string, never>;
}

export interface InvitationExpirationJobPayloads {
  expireInvitations: Record<string, never>;
}
