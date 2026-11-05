import type { EventBusPort } from "./event-bus.port";
import type { DomainEvent } from "./domain-event";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";

/**
 * BullMQ-backed event bus implementation.
 *
 * Publishes domain events as BullMQ jobs on a dedicated
 * domain-events queue. The event's `eventType` enum value becomes
 * the BullMQ job name, enabling routing in the worker via
 * a switch on `job.name`.
 */
export class BullMqEventBus implements EventBusPort {
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await queueService.addJob(
      QUEUE_NAMES.DOMAIN_EVENTS_QUEUE,
      event.eventType,
      event,
    );
  }
}
