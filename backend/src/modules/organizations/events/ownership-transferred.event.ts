import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";

export interface OwnershipTransferredPayload {
  organizationId: number;
  organizationName: string;
  previousOwnerUserId: number;
  previousOwnerFullName: string;
  newOwnerUserId: number;
  newOwnerEmail: string;
  newOwnerFullName: string;
}

export function createOwnershipTransferredEvent(
  payload: OwnershipTransferredPayload,
  correlationId?: string,
): DomainEvent<OwnershipTransferredPayload> {
  return {
    eventType: DomainEventType.OWNERSHIP_TRANSFERRED,
    payload,
    occurredAt: new Date().toISOString(),
    correlationId,
  };
}
