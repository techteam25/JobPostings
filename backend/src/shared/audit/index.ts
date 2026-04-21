import { PinoAuditAdapter } from "./pino-audit.adapter";
import type { AuditServicePort } from "./audit.port";

/**
 * Module-level audit singleton. Mirrors the `typesenseClient` pattern:
 * infrastructure clients are imported directly, domain services are
 * port-injected through composition roots. Audit emission is a thin
 * cross-cutting concern with one method — a singleton fits better than
 * per-module DI wiring.
 *
 * Tests swap the implementation via `vi.mock("@shared/audit")`, matching
 * the existing global-mock pattern for queueService and EmailService
 * (see CLAUDE.md).
 */
export const auditService: AuditServicePort = new PinoAuditAdapter();

export {
  AuditEvent,
  AuditEventName,
  AuditActor,
  AuditResource,
  AuditOutcome,
  type AuditServicePort,
} from "./audit.port";
