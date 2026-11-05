import logger from "@shared/logger";
import { auditEventsEmittedTotal } from "@shared/metrics";
import { AuditEvent, type AuditServicePort } from "./audit.port";

/**
 * Pino-backed audit adapter. Validates the envelope via Zod, then emits a
 * single structured log line with `event: "audit"` so downstream Loki
 * queries can filter by that field alone.
 *
 * Adapter is non-throwing: validation errors are logged at warn level but
 * never surfaced to callers. Audit emission must not break the request path.
 *
 * trace_id / span_id are injected by the logger's global OTel mixin, so we
 * do NOT merge them in here.
 */
export class PinoAuditAdapter implements AuditServicePort {
  emit(event: AuditEvent): void {
    const parsed = AuditEvent.safeParse(event);

    if (!parsed.success) {
      logger.warn(
        {
          event: "audit.invalid",
          attemptedName: (event as { name?: string })?.name,
          issues: parsed.error.issues,
        },
        "audit envelope rejected",
      );
      return;
    }

    const { name, actor, resource, action, outcome, failureReason, metadata } =
      parsed.data;

    logger.info(
      {
        event: "audit",
        audit: {
          name,
          actor,
          resource,
          action,
          outcome,
          failureReason,
          metadata,
        },
      },
      name,
    );

    auditEventsEmittedTotal.add(1, { name, outcome });
  }
}
