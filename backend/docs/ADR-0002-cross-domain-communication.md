# Cross-Domain Communication

> Resolves: Phase 3 Audit Issue #1 (bidirectional job-board ↔ applications coupling) and Phase 2 P2-2 (cross-domain data access at repository layer).

## Decision Record

Two communication mechanisms, chosen by **staleness tolerance**:

| Mechanism | When to use | Example |
|-----------|-------------|---------|
| **Query Facade (ACL)** | Synchronous reads where stale data = correctness bug | Authorization checks, deletion guards |
| **Domain Event (BullMQ)** | Async writes/reactions where eventual consistency is acceptable | Analytics counters, cascading state changes |

## Design Decisions

### 1. Facade DTO visibility

Facade return-type DTOs (e.g. `JobForApplication`, `JobWithEmployerId`) are **not exported from module barrel files**. They are internal value objects defined inside the facade file. Consumers infer the types from the facade port's method signatures. This prevents misuse — only the facade port is importable.

### 2. Event type safety

`eventType` uses a TypeScript `enum` (`DomainEventType`) rather than a const string, providing compile-time safety on both the publish and handler sides.

### 3. Event envelope vs payload

`DomainEvent<TPayload>` is the **envelope** (metadata + payload). Payload types like `ApplicationSubmittedPayload` are pure domain data composed into the envelope — they do not extend `DomainEvent`. This keeps concerns separated: the event infrastructure owns the envelope shape, each module owns its payload shapes.

### 4. `pauseAlertsForInactiveUsers` — event + ACL safety net

The `UserDeactivated` event provides **immediate** alert pausing (seconds), replacing the current batch-only approach (minutes/hours). The existing batch worker is retained as a **reconciliation sweep** using `IdentityQueryFacade` (ACL), catching any missed events.

| Approach | Latency | Reliability |
|----------|---------|-------------|
| ~~Current batch job (JOINs user table)~~ | Minutes/hours | High — catches everything per sweep |
| Event only (`UserDeactivated`) | Seconds | Risk: missed event = never paused |
| **Event + batch safety net (chosen)** | Seconds (normal), minutes (fallback) | **Highest** |

### 5. Workers stay in `src/workers/` for now

Worker modularization (moving workers into their owning modules) is Phase 8 scope. The domain event worker is created in `src/workers/` following the current established pattern.

## Cross-Context Coupling Inventory

### job-board → applications (3 calls, all reads → Query Facade)

| Method | What it needs | Facade contract |
|--------|---------------|-----------------|
| `getAllActiveJobs` | Which jobs a user applied to | `getAppliedJobIds(userId, jobIds): Set<number>` |
| `getJobById` | Has user applied to this job? | `hasUserApplied(userId, jobId): boolean` |
| `deleteJob` | Are there any applications? (guard) | `hasApplicationsForJob(jobId): boolean` |

### applications → job-board (3 calls, all reads → Query Facade)

| Method | What it needs | Facade contract |
|--------|---------------|-----------------|
| `applyForJob` | Job exists, active, deadline, title | `getJobForApplication(jobId): JobForApplication \| null` |
| `getJobApplications` | Job's employer ID (authorization) | `getJobWithEmployerId(jobId): JobWithEmployerId \| null` |
| `updateApplicationStatus` | Same authorization check | Reuses `getJobWithEmployerId` |

### applications → job-board write (1 call → Domain Event)

| Method | What it does | Event |
|--------|-------------|-------|
| `createApplication` | Increments `jobInsights.applicationCount` | `ApplicationSubmitted` → job-board worker increments |

### notifications → identity (event + ACL safety net)

| Mechanism | Trigger | Action |
|-----------|---------|--------|
| `UserDeactivated` event | User deactivates account | Immediately pause that user's alerts |
| Batch worker (safety net) | Scheduled interval | `IdentityQueryFacade.getInactiveUserIds()` → pause any missed alerts |

### user-profile → job-board (deferred)

| Method | What it accesses | Decision |
|--------|-----------------|----------|
| `getSavedJobsForUser` | JOINs `jobsDetails` + `organizations` | Keep JOIN for now; document as Phase 7+ debt |
| `saveJobForUser` | Reads `jobsDetails` for existence check | Could use `doesJobExist` facade; defer to Phase 7+ |

## Query Facade Interfaces

### ApplicationStatusQueryPort

```typescript
// src/modules/job-board/ports/application-status-query.port.ts

// Port only — no DTOs exported from barrel
export interface ApplicationStatusQueryPort {
  getAppliedJobIds(userId: number, jobIds: number[]): Promise<Set<number>>;
  hasUserApplied(userId: number, jobId: number): Promise<boolean>;
  hasApplicationsForJob(jobId: number): Promise<boolean>;
}
```

### JobDetailsQueryPort

```typescript
// src/modules/applications/ports/job-details-query.port.ts

// Internal value objects — NOT exported from barrel file
interface JobForApplication {
  id: number;
  title: string;
  isActive: boolean;
  applicationDeadline: Date | null;
  employerId: number;
}

interface JobWithEmployerId {
  jobId: number;
  employerId: number;
  employerOrgId: number;
}

// Port only — exported from barrel
export interface JobDetailsQueryPort {
  getJobForApplication(jobId: number): Promise<JobForApplication | null>;
  getJobWithEmployerId(jobId: number): Promise<JobWithEmployerId | null>;
  doesJobExist(jobId: number): Promise<boolean>;
}
```

Consumers infer return types from method signatures. No direct import of `JobForApplication` or `JobWithEmployerId` is possible from outside the module.

### UserActivityQueryPort

```typescript
// src/modules/notifications/ports/user-activity-query.port.ts

export interface UserActivityQueryPort {
  getInactiveUserIds(): Promise<number[]>;
  getUserContactInfo(userId: number): Promise<{ email: string; fullName: string } | null>;
}
```

## Domain Event Infrastructure

### Enum-based event types

```typescript
// src/shared/events/event-types.ts
export enum DomainEventType {
  APPLICATION_SUBMITTED = "applications.ApplicationSubmitted",
  USER_DEACTIVATED = "identity.UserDeactivated",
}
```

### Event envelope (generic, payload is composed — not inherited)

```typescript
// src/shared/events/domain-event.ts
import type { DomainEventType } from "./event-types";

export interface DomainEvent<TPayload = unknown> {
  readonly eventType: DomainEventType;
  readonly payload: TPayload;
  readonly occurredAt: string;
  readonly correlationId?: string;
}
```

### Event bus port

```typescript
// src/shared/events/event-bus.port.ts
export interface EventBusPort {
  publish<T>(event: DomainEvent<T>): Promise<void>;
}

// src/shared/events/bullmq-event-bus.port.ts — implements EventBusPort using queueService.addJob
```

### Event payloads (pure domain data, not extending DomainEvent)

```typescript
// src/modules/applications/events/application-submitted.event.ts
export interface ApplicationSubmittedPayload {
  applicationId: number;
  jobId: number;
  applicantId: number;
}

// src/modules/identity/events/user-deactivated.event.ts
export interface UserDeactivatedPayload {
  userId: number;
  email: string;
  deactivatedAt: string;
}
```

### Domain event worker

```
src/workers/domain-event-worker.ts
  — routes by job.name (DomainEventType enum value)
  — APPLICATION_SUBMITTED → JobInsightsRepository.incrementJobApplications(jobId)
  — USER_DEACTIVATED → NotificationsRepository.pauseAlertsForUser(userId)
```

## Implementation Phases

### Phase A: Shared event infrastructure (~0.5 day)

| Action | File |
|--------|------|
| CREATE | `src/shared/events/domain-event.ts` |
| CREATE | `src/shared/events/event-types.ts` — `DomainEventType` enum |
| CREATE | `src/shared/events/event-bus.port.ts` |
| CREATE | `src/shared/events/bullmq-event-bus.port.ts` |
| CREATE | `src/shared/events/index.ts` |
| MODIFY | `src/shared/infrastructure/queue.service.ts` — add `DOMAIN_EVENTS_QUEUE` |

Zero behavior change. All tests pass unchanged.

### Phase B: Query facades (~1 day)

| Action | File |
|--------|------|
| CREATE | `src/modules/job-board/ports/application-status-query.port.ts` |
| CREATE | `src/modules/applications/ports/job-details-query.port.ts` |
| CREATE | `src/modules/notifications/ports/user-activity-query.port.ts` |
| MODIFY | `src/modules/applications/index.ts` — export facade port + class only (no DTOs) |
| MODIFY | `src/modules/job-board/index.ts` — export facade port + class only (no DTOs) |
| MODIFY | `src/modules/identity/index.ts` — export facade port + class |
| MODIFY | `src/modules/identity/ports/identity-repository.port.ts` — add `findDeactivatedUserIds` |
| MODIFY | `src/modules/identity/repositories/identity.repository.ts` — implement it |
| CREATE | `tests/unit/shared/adapters/applications-to-job-board.adapter.test.ts` |
| CREATE | `tests/unit/shared/adapters/job-board-to-applications.adapter.test.ts` |
| CREATE | `tests/unit/shared/adapters/identity-to-notifications.adapter.test.ts` |

Zero behavior change. All existing tests pass unchanged.

### Phase C+F: Wire facades into services + composition root (~1 day)

**This is the phase that breaks the circular dependency.**

| Action | File | Changes |
|--------|------|---------|
| MODIFY | `job-board.service.ts` | Replace `ApplicationsRepositoryPort` → `ApplicationsQueryFacadePort` |
| MODIFY | `applications.service.ts` | Replace `JobBoardRepositoryPort` → `JobBoardQueryFacadePort` |
| MODIFY | `job-board.routes.ts` | Accept `ApplicationsQueryFacadePort` instead of `ApplicationsRepositoryPort` |
| MODIFY | `applications.routes.ts` | Accept `JobBoardQueryFacadePort` instead of `JobBoardRepositoryPort` |
| MODIFY | `job.routes.ts` | Instantiate facades, pass to factories |

After this phase, no module imports another module's repository port. Existing integration tests pass because facades delegate to the same repository methods that spies already target.

### Phase D+E: Domain events for applicationCount + UserDeactivated (~1 day)

| Action | File | Changes |
|--------|------|---------|
| CREATE | `src/modules/applications/events/application-submitted.event.ts` | Payload + factory |
| CREATE | `src/modules/identity/events/user-deactivated.event.ts` | Payload + factory |
| CREATE | `src/workers/domain-event-worker.ts` | Worker + init function |
| MODIFY | `applications.repository.ts` | Remove `jobInsights` import and UPDATE from `createApplication` |
| MODIFY | `applications.service.ts` | Add `EventBusPort`, publish `ApplicationSubmitted` after create |
| MODIFY | `identity.service.ts` | Publish `UserDeactivated` on `deactivateSelf`/`deactivateUser` |
| MODIFY | `applications.routes.ts` | Accept + pass `EventBusPort` |
| MODIFY | `job.routes.ts` | Instantiate `BullMqEventBus`, pass to factory |
| MODIFY | `app.ts` | Call `initializeDomainEventWorker()` |
| CREATE | `tests/unit/workers/domain-event-worker.test.ts` |

### Phase G: Notifications decoupling — batch worker becomes safety net (~0.5 day)

| Action | File | Changes |
|--------|------|---------|
| MODIFY | `notifications-repository.port.ts` | Add `pauseAlertsForUser(userId: number)` for single-user event path |
| MODIFY | `notifications-repository.port.ts` | Change `pauseAlertsForInactiveUsers(inactiveUserIds: number[])` to accept IDs |
| MODIFY | `notifications.repository.ts` | Remove `user` table JOIN, accept IDs as param |
| MODIFY | `notifications.repository.ts` | Implement `pauseAlertsForUser` for single-user event handler |
| MODIFY | `inactive-user-alert-pauser.ts` | Use `IdentityQueryFacade.getInactiveUserIds()` (ACL), pass to repo |
| MODIFY | `domain-event-worker.ts` | Add `USER_DEACTIVATED` handler → calls `pauseAlertsForUser` |

## Dependency Graph After

```
job-board ──type import──→ ApplicationsQueryFacadePort
applications ──type import──→ JobBoardQueryFacadePort
applications ──type import──→ EventBusPort (shared)
identity ──type import──→ EventBusPort (shared)
notifications ──type import──→ IdentityQueryFacadePort

Composition root (job.routes.ts)
  ├── instantiates ApplicationsQueryFacade(applicationsRepository)
  ├── instantiates JobBoardQueryFacade(jobBoardRepository)
  ├── instantiates BullMqEventBus()
  └── passes facades + event bus to route factories

domain-event-worker
  ├── APPLICATION_SUBMITTED → JobInsightsRepository.incrementJobApplications
  └── USER_DEACTIVATED → NotificationsRepository.pauseAlertsForUser
```

No module-to-module repository imports. Circular dependency eliminated.
Worker modularization deferred to Phase 8.
