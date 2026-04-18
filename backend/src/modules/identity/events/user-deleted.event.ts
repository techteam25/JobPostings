import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";

export interface UserDeletedPayload {
  userId: number;
  email: string;
  deletedAt: string;
}

export function createUserDeletedEvent(
  payload: UserDeletedPayload,
  correlationId?: string,
): DomainEvent<UserDeletedPayload> {
  return {
    eventType: DomainEventType.USER_DELETED,
    payload,
    occurredAt: new Date().toISOString(),
    correlationId,
  };
}
