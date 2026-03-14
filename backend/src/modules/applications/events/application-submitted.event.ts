import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";

export interface ApplicationSubmittedPayload {
  applicationId: number;
  jobId: number;
  applicantId: number;
}

export function createApplicationSubmittedEvent(
  payload: ApplicationSubmittedPayload,
  correlationId?: string,
): DomainEvent<ApplicationSubmittedPayload> {
  return {
    eventType: DomainEventType.APPLICATION_SUBMITTED,
    payload,
    occurredAt: new Date().toISOString(),
    correlationId,
  };
}
