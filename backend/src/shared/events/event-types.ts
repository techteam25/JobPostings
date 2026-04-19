/**
 * Registry of all domain event types in the system.
 *
 * Each value follows the convention `module.EventName` to provide
 * clear provenance. The enum provides compile-time safety on both
 * the `publish` and `handler` sides — no string typos possible.
 */
export enum DomainEventType {
  APPLICATION_SUBMITTED = "applications.ApplicationSubmitted",
  USER_DEACTIVATED = "identity.UserDeactivated",
  USER_DELETED = "identity.UserDeleted",
}
