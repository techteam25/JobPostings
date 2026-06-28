import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";

export interface ApplicationWithdrawnPayload {
  applicationId: number;
  jobId: number;
  applicantId: number;
}

export function createApplicationWithdrawnEvent(
  payload: ApplicationWithdrawnPayload,
  correlationId?: string,
): DomainEvent<ApplicationWithdrawnPayload> {
  return {
    eventType: DomainEventType.APPLICATION_WITHDRAWN,
    payload,
    occurredAt: new Date().toISOString(),
    correlationId,
  };
}
