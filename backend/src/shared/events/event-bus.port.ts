import type { DomainEvent } from "./domain-event";

/**
 * Port for publishing domain events.
 *
 * Modules depend on this interface (not the BullMQ implementation)
 * so they can be tested with a fake event bus that records
 * published events without touching infrastructure.
 */
export interface EventBusPort {
  /**
   * Publish a domain event to be processed asynchronously.
   * Returns immediately; processing happens in background via a worker.
   */
  publish<T>(event: DomainEvent<T>): Promise<void>;
}
