# ADR-0001: Architecture Audit & Modular Monolith Evaluation

**Status**: Accepted & Implemented (Phases 0-9 complete)
**Date**: 2026-03-10
**Deciders**: Tech Team
**Context**: Job Board Backend (Express.js 5 + TypeScript + Bun)

---

## 1. Executive Summary

This document captures the findings of an architecture audit of the Job Board backend and evaluates the effort required to refactor toward a **Modular Monolith** architecture.

The current system uses a **layered architecture** (Controller -> Service -> Repository) with **manual constructor instantiation** (not true dependency injection). While functional, the architecture exhibits significant **cross-domain coupling**, **God-class tendencies**, and a **lack of domain boundary enforcement** that will increasingly hinder maintainability as the system grows.

**Overall Architecture Score: 5.5 / 10**
**Compliance Level: Needs Improvement**

---

## 2. Current Architecture Analysis

### 2.1 Structure Overview

```
src/
  controllers/       # 3 controllers + base class (3,239 lines)
  services/          # 4 services + base class (3,470 lines)
  repositories/      # 4 repositories + base class (3,437 lines)
  routes/            # 4 route files + index (4,868 lines)
  middleware/        # 7 middleware files (1,931 lines)
  infrastructure/   # 6 infrastructure services (2,633 lines)
  workers/          # 7 background workers
  db/schema/        # 9 schema files + index
  validations/      # Zod schema definitions
  config/           # Environment, Firebase, Typesense config
  utils/            # Shared utilities, error classes, auth
  types/            # TypeScript type definitions
  swagger/          # OpenAPI registry
  logger/           # Pino logger setup
```

**Total**: ~22,913 lines across 84 source files, 35 test files.

### 2.2 Dependency Instantiation Pattern (Labeled "Constructor Injection")

The codebase uses what is described as constructor injection, but it is more precisely **manual constructor instantiation** — a critical distinction:

```typescript
// What the codebase does (manual instantiation):
class JobService extends BaseService {
  constructor() {
    this.jobRepository = new JobRepository(); // hardcoded
    this.organizationRepository = new OrganizationRepository(); // hardcoded
    this.typesenseService = new TypesenseService(); // hardcoded
  }
}

// What true constructor injection looks like:
class JobService extends BaseService {
  constructor(
    private jobRepository: JobRepositoryPort, // injected
    private organizationRepository: OrganizationRepositoryPort,
    private typesenseService: TypesenseServicePort,
  ) {}
}
```

**Key difference**: True constructor injection receives dependencies from the outside (via a DI container or manual composition root), allowing substitution for testing and decoupling. The current approach **hardcodes concrete class instantiation** inside constructors, making every class responsible for knowing and creating its own dependencies.

### 2.3 Full Instantiation Map

34 `new` calls across the codebase create domain objects:

| Location                             | Instantiates                                                                                             | Cross-Domain?       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------- |
| `UserController` constructor         | `UserService`, `OrganizationService`                                                                     | Yes                 |
| `JobController` constructor          | `JobService`                                                                                             | No                  |
| `OrganizationController` constructor | `OrganizationService`                                                                                    | No                  |
| `UserService` constructor            | `UserRepository`, `EmailService`, `OrganizationRepository`                                               | Yes                 |
| `JobService` constructor             | `JobRepository`, `OrganizationRepository`, `JobInsightsRepository`, `TypesenseService`, `UserRepository` | Yes                 |
| `OrganizationService` constructor    | `OrganizationRepository`, `UserRepository`, `JobRepository`                                              | Yes                 |
| `JobMatchingService` constructor     | `TypesenseService`                                                                                       | No                  |
| `EmailService` constructor           | `UserRepository`                                                                                         | Yes                 |
| `AuthMiddleware` constructor         | `OrganizationService`, `UserService`, `JobRepository`, `OrganizationRepository`, `JobService`            | Yes (all 3 domains) |
| `auth.ts` (module level)             | `EmailService`, `UserService`                                                                            | Yes                 |
| Workers (various)                    | Various repositories and services                                                                        | Yes                 |
| Infrastructure singletons            | `QueueService`, `FirebaseUploadService`, `RedisCacheService`, `RedisRateLimiterService`                  | N/A                 |

### 2.4 Cross-Domain Coupling Matrix

```
                   Users    Jobs    Organizations    Infrastructure
                  -------  ------  ---------------  ---------------
Users (service)      X                   R/W              Queue
Jobs (service)      R/W       X          R/W         Queue, Typesense
Organizations       R/W      R/W          X               Queue
Auth Middleware     R/W      R/W         R/W               -
Email Service       R/W       -            -             Nodemailer
Workers             R/W      R/W         R/W         Queue, Firebase

Legend: R/W = reads & writes, X = own domain
```

**Every service depends on at least one other domain's repository.** There are no domain boundaries enforced at the code level.

---

## 3. Architectural Issues (Ranked by Severity)

### 3.1 CRITICAL: No Dependency Inversion

**Finding**: Zero interfaces/ports exist for repositories or services. All dependencies are concrete classes.

**Impact**:

- Unit testing requires either running a real database or complex mocking of `db` imports
- Cannot substitute implementations (e.g., swap MySQL for PostgreSQL, or mock email for testing)
- No compile-time contract enforcement between layers

**Evidence**: `BaseRepository` directly imports `db` from `@/db/connection` (line 3). Services directly instantiate concrete repositories.

### 3.2 CRITICAL: Auth Middleware is a Cross-Domain God Object

**Finding**: `AuthMiddleware` (798 lines) instantiates 5 dependencies spanning all 3 domains.

**Evidence**: `src/middleware/auth.middleware.ts:32-37` — constructor creates `OrganizationService`, `UserService`, `JobRepository`, `OrganizationRepository`, `JobService`.

**Impact**: Authentication concerns are tangled with authorization/business logic from every domain. Changes to any domain can break authentication middleware.

### 3.3 HIGH: Service God Classes

| File                      | Lines | Responsibilities                                                                           |
| ------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| `user.service.ts`         | 1,365 | Profile, alerts, email preferences, education, certifications, work experience, onboarding |
| `organization.service.ts` | 1,045 | CRUD, members, invitations, applications, notes                                            |
| `job.service.ts`          | 966   | CRUD, search, applications, statistics, insights                                           |

Each service handles 20-40+ methods. The Single Responsibility Principle is violated — these are "do everything" classes organized by entity rather than use case.

### 3.4 HIGH: Repository God Classes

`user.repository.ts` at **1,515 lines** is the largest file in the codebase. It handles user profiles, education, work experience, certifications, job alerts, email preferences, and onboarding — responsibilities that span multiple sub-domains.

### 3.5 MODERATE: Duplicate Object Creation

`UserRepository` is instantiated in at least 6 different locations. `OrganizationRepository` appears in 5 locations. Without a DI container or composition root, the same repository is constructed repeatedly with no lifecycle management.

### 3.6 MODERATE: Infrastructure Singleton Inconsistency

Some infrastructure services are singletons (`queueService`, `redisCacheService`) while others are instantiated per-consumer (`EmailService`, `TypesenseService`). No clear pattern governs which approach is used.

---

## 4. Positive Findings

- **Result Type Pattern**: Services return `Result<T, E>` using `ok(value)` / `fail(error)` instead of throwing exceptions — a strong foundation for explicit error handling
- **Standardized Response Format**: `BaseController` enforces consistent API response shapes `{ success, message, data, timestamp }`
- **Validation Layer**: Zod schemas centralized in `src/validations/` with middleware enforcement
- **Infrastructure Resilience**: `initializeInfrastructure()` treats external services as non-critical, gracefully degrading when Redis/Typesense are unavailable
- **Test Infrastructure**: Well-structured test setup with `cleanAll()`, seed builders, and scenario helpers
- **TypeScript Strictness**: `strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess` enabled. Only 15 `any` occurrences across 22,913 lines (0.065%)
- **OpenAPI Generation**: Zod schemas feed into auto-generated API docs via `@asteasolutions/zod-to-openapi`

---

## 5. Modular Monolith: Target Architecture

### 5.1 Proposed Module Boundaries

Based on domain analysis and database foreign key relationships, the following bounded contexts are identified:

```
src/
  modules/
    identity/           # Auth, sessions, accounts (Better-Auth integration)
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    user-profile/       # Profiles, education, work experience, certifications
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    job-board/          # Job postings, skills, search, insights
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    applications/       # Job applications, application notes, saved jobs
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    organizations/      # Org CRUD, membership, subscriptions
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    invitations/        # Organization invitations (already partially isolated)
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

    notifications/      # Email sending, job alerts, alert matching
      controllers/
      services/
      repositories/
      routes/
      validations/
      types/

  shared/               # Shared kernel (minimal)
    base/               # BaseController, BaseService, BaseRepository
    errors/             # AppError hierarchy
    result/             # Result<T, E>, ok(), fail()
    types/              # Shared types (PaginationMeta, ApiResponse)
    middleware/         # Auth, rate-limit, request-logger, error handler
    infrastructure/     # Redis, Queue, Firebase (platform services)
    db/                 # Connection, migrations, shared schema utilities
    config/             # Env, Firebase config, Typesense client
    logger/             # Pino setup
```

### 5.2 Inter-Module Communication

**Rule**: Modules MUST NOT import from each other's internal files. Cross-module communication flows through:

1. **Public Module APIs**: Each module exports a slim public interface (facade/application service)
2. **Event-Driven Communication**: BullMQ queues for async cross-module operations (already partially in place via workers)
3. **Shared IDs**: Modules reference each other by ID only — never by importing the other module's entities

**Example**: When `applications` module processes a job application, it emits an event to the `notifications` module queue rather than directly importing `EmailService`.

### 5.3 Dependency Injection Refactoring

Introduce **true constructor injection** with a lightweight composition root:

```typescript
// modules/job-board/composition-root.ts
import { JobController } from "./controllers/job.controller";
import { JobService } from "./services/job.service";
import { JobRepository } from "./repositories/job.repository";
import { TypesenseService } from "@/shared/infrastructure/typesense.service";

export function createJobModule() {
  const jobRepository = new JobRepository();
  const typesenseService = new TypesenseService();
  const jobService = new JobService(jobRepository, typesenseService);
  const jobController = new JobController(jobService);

  return { controller: jobController, service: jobService };
}
```

Services accept interfaces (ports) rather than concrete classes:

```typescript
// modules/job-board/ports/job-repository.port.ts
export interface JobRepositoryPort {
  create(data: CreateJobInput): Promise<number>;
  findById(id: number): Promise<Job>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Job>>;
  // ...
}
```

---

## 6. Effort Estimation: Refactoring to Modular Monolith

### 6.1 Phase Breakdown

| Phase       | Description                                                                                | Effort   | Risk   |
| ----------- | ------------------------------------------------------------------------------------------ | -------- | ------ |
| **Phase 0** | Prerequisite: Introduce interfaces/ports for repositories and services                     | 3-4 days | Low    |
| **Phase 1** | Extract shared kernel (`shared/` folder with base classes, errors, Result type, config)    | 2-3 days | Low    |
| **Phase 2** | Split `UserService` (1,365 lines) into `identity`, `user-profile`, `notifications` modules | 4-5 days | Medium |
| **Phase 3** | Split `JobService` (966 lines) into `job-board` and `applications` modules                 | 3-4 days | Medium |
| **Phase 4** | Extract `organizations` and `invitations` modules                                          | 2-3 days | Low    |
| **Phase 5** | Refactor `AuthMiddleware` — extract authorization into module-specific guards              | 3-4 days | High   |
| **Phase 6** | Introduce composition roots per module; remove `new` from constructors                     | 2-3 days | Medium |
| **Phase 7** | Add module-level public APIs (facades) and enforce import boundaries                       | 2-3 days | Medium |
| **Phase 8** | Migrate workers to module-owned background processors                                      | 2-3 days | Low    |
| **Phase 9** | Update all tests to use injected dependencies                                              | 3-4 days | Medium |

### 6.2 Total Effort

| Category     | Estimate                                    |
| ------------ | ------------------------------------------- |
| **Minimum**  | 22 person-days (~4.5 weeks for 1 developer) |
| **Expected** | 30 person-days (~6 weeks for 1 developer)   |
| **Maximum**  | 38 person-days (~8 weeks for 1 developer)   |

With 2 developers working in parallel (after Phase 0-1 are complete): **3-5 weeks**.

### 6.3 Risk Assessment

| Risk                                                 | Likelihood | Impact | Mitigation                                                 |
| ---------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------- |
| Breaking existing tests during refactoring           | High       | Medium | Incremental moves with CI running after each phase         |
| Auth middleware refactoring introduces security gaps | Medium     | High   | Dedicated security review after Phase 5                    |
| Cross-domain database JOINs become harder to express | Medium     | Medium | Allow shared read-only query views in shared kernel        |
| Team velocity drops during transition                | High       | Low    | Run phases as dedicated sprint(s), not mixed with features |
| Import boundary enforcement requires tooling         | Low        | Low    | Use ESLint `no-restricted-imports` rules                   |

### 6.4 Recommended Approach: Incremental Strangler Fig

Rather than a big-bang rewrite, refactor one module at a time using the **Strangler Fig** pattern:

1. **Start with the most isolated module**: `invitations` (already has its own route file, least cross-domain coupling)
2. **Then extract**: `organizations` -> `job-board` -> `applications` -> `user-profile` -> `notifications` -> `identity`
3. **Each extraction is a standalone PR** that can be reviewed and tested independently
4. **Import boundaries enforced incrementally** — add ESLint rules as modules are extracted

---

## 7. Decision

### 7.1 What We Are Deciding

Whether to refactor the current layered architecture into a Modular Monolith, and if so, what approach and timeline to adopt.

### 7.2 Options Considered

#### Option A: Status Quo (Do Nothing)

- **Pros**: Zero effort, no disruption
- **Cons**: Technical debt compounds; services will continue growing; testing remains difficult; onboarding new developers becomes harder
- **Verdict**: Not recommended for a growing system

#### Option B: Incremental Modularization (Recommended)

- **Pros**: Manageable risk; each phase delivers independent value; team learns incrementally; can pause and resume
- **Cons**: Takes 4-8 weeks; requires discipline to enforce boundaries; transition period has mixed patterns
- **Verdict**: Best balance of effort and payoff

#### Option C: Big-Bang Modular Monolith Rewrite

- **Pros**: Clean result; no transition period with mixed patterns
- **Cons**: High risk; blocks all feature work for 6-8 weeks; hard to review; all-or-nothing
- **Verdict**: Not recommended — too risky for a production system

### 7.3 Decision Outcome

**Option B: Incremental Modularization** is recommended.

**Immediate actions** (can start this sprint):

1. Introduce repository and service interfaces (ports) — zero behavior change, pure refactoring
2. Extract `Result<T, E>` and error classes into `shared/` — already logically independent
3. Add ESLint `no-restricted-imports` rules to begin enforcing boundaries

**Short-term** (next 2-3 sprints): 4. Extract `invitations` as the first fully modular context 5. Split `AuthMiddleware` into authentication (shared) + authorization guards (per-module)

**Medium-term** (subsequent sprints): 6. Extract remaining modules one at a time, ordered by isolation (least-coupled first) 7. Introduce composition roots per module

---

## 8. Consequences

### Positive

- Clear domain boundaries reduce cognitive load
- True DI enables proper unit testing without database
- Modules can be developed, tested, and deployed more independently
- Easier onboarding — new developers learn one module at a time
- Foundation for potential future extraction to microservices (if needed)

### Negative

- Temporary code duplication during transition (some shared queries may need to be duplicated)
- Need to establish and enforce module boundary conventions (tooling + code review)
- Slightly more boilerplate for cross-module communication (events vs. direct calls)
- Learning curve for team members unfamiliar with modular monolith patterns

### Neutral

- Shared database remains — this is a monolith, not microservices
- Base classes (`BaseController`, `BaseService`, `BaseRepository`) move to shared kernel — still used by all modules
- Infrastructure services (Redis, BullMQ, Firebase) remain centralized singletons in shared kernel

---

## 9. References

- [Modular Monolith Architecture by Kamil Grzybek](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer)
- [Majestic Modular Monoliths by Axel Fontaine](https://www.youtube.com/watch?v=BOvxJaklcr0)
- Martin Fowler, "MonolithFirst" (2015)
- Sam Newman, "Building Microservices" (2021) — Chapter on Modular Monoliths
- Vaughn Vernon, "Implementing Domain-Driven Design" (2013) — Bounded Contexts

---

**Document Generated**: 2026-03-10
**Auditor**: Architecture Auditor (Claude)
**Next Review**: Post-implementation — all 10 phases complete as of 2026-03-16
