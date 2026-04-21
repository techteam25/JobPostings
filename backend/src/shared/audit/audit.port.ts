import { z } from "zod";

/**
 * v1 audit-event inventory
 * Any emission outside this set fails Zod validation at the adapter boundary.
 */
export const AuditEventName = z.enum([
  // Auth
  "auth.signin.success",
  "auth.signin.failed",
  "auth.signup",
  "auth.signout",
  "auth.oauth.linked",
  "auth.password.changed",

  // Account lifecycle
  "account.deactivated",
  "account.deleted",

  // Profile
  "profile.updated",
  "profile.visibility.changed",
  "profile.cv.uploaded",
  "profile.cv.deleted",

  // Job board
  "job.created",
  "job.updated",
  "job.deleted",
  "job.published",
  "job.unpublished",

  // Applications
  "application.submitted",
  "application.withdrawn",

  // Organizations
  "org.created",
  "org.member.added",
  "org.member.removed",
  "org.member.role.changed",
  "org.invitation.sent",
  "org.invitation.accepted",
  "org.invitation.revoked",

  // Sensitive-read allowlist (emitted by auditRead middleware)
  "read.admin",
  "read.profile.cross_user",
  "read.application.by_employer",
  "read.invitation.by_token",
]);
export type AuditEventName = z.infer<typeof AuditEventName>;

export const AuditActor = z.object({
  /**
   * Caller's user id. Optional because failed-signin and token-read events
   * may occur before identity is established.
   */
  id: z.union([z.string(), z.number()]).optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});
export type AuditActor = z.infer<typeof AuditActor>;

export const AuditResource = z.object({
  /** Aggregate type, e.g. "user", "job", "organization", "application". */
  type: z.string().min(1),
  /** Resource identifier. Stringified to avoid number/string drift across callers. */
  id: z.union([z.string(), z.number()]).optional(),
});
export type AuditResource = z.infer<typeof AuditResource>;

export const AuditOutcome = z.enum(["success", "failure"]);
export type AuditOutcome = z.infer<typeof AuditOutcome>;

/**
 * Envelope contract. Adapters auto-fill correlationId, trace_id, span_id,
 * and timestamp — callers MUST NOT supply those.
 */
export const AuditEvent = z.object({
  name: AuditEventName,
  actor: AuditActor,
  resource: AuditResource,
  /**
   * Verb phrase describing what was attempted (e.g. "signed in",
   * "updated profile visibility"). Free-form at v1 — structure later if
   * consumers demand it.
   */
  action: z.string().min(1),
  outcome: AuditOutcome,
  /** Populated only when outcome === "failure". */
  failureReason: z.string().optional(),
  /**
   * Event-specific context. No PII beyond what's already in the envelope
   * (no passwords, tokens, full request bodies). Attempted email is OK
   * because it's already captured by pino HTTP logs.
   */
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AuditEvent = z.infer<typeof AuditEvent>;

/**
 * Audit emission port. Implementations MUST be non-throwing at the call site
 * — internal failures are logged but never surfaced to callers. Callers treat
 * emit() as fire-and-forget.
 */
export interface AuditServicePort {
  emit(event: AuditEvent): void;
}
