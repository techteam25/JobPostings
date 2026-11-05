import type { DomainEventType } from "./event-types";

/**
 * Generic type for all domain events.
 *
 * This is the transport shape — metadata plus payload. Payload types
 * (e.g. `ApplicationSubmittedPayload`) are pure domain data composed
 * into this generic; they do not extend it.
 *
 * @template TPayload - The domain-specific event data
 */
export interface DomainEvent<TPayload = unknown> {
  /** Event type from the DomainEventType enum. Used for routing in workers. */
  readonly eventType: DomainEventType;
  /** Domain-specific event data */
  readonly payload: TPayload;
  /** ISO 8601 timestamp of when the event was created */
  readonly occurredAt: string;
  /** Correlation ID for tracing across modules */
  readonly correlationId?: string;
}
