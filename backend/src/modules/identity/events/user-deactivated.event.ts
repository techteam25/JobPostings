import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";

export interface UserDeactivatedPayload {
  userId: number;
  email: string;
  deactivatedAt: string;
}

export function createUserDeactivatedEvent(
  payload: UserDeactivatedPayload,
  correlationId?: string,
): DomainEvent<UserDeactivatedPayload> {
  return {
    eventType: DomainEventType.USER_DEACTIVATED,
    payload,
    occurredAt: new Date().toISOString(),
    correlationId,
  };
}
