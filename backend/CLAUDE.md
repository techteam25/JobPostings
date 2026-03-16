# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job Board backend API — Express.js 5 + TypeScript, running on Bun. Uses MySQL via Drizzle ORM, Redis (cache, queue, rate-limiting — three separate instances), BullMQ for background jobs, Typesense for full-text search, Firebase Storage for file uploads, and Better-Auth for authentication (Google/LinkedIn OAuth).

## Commands

```bash
# Development
bun run dev                    # Start dev server with --watch (port from .env, default 5500)
bun run build                  # Build with bun targeting bun runtime
bun run type-check             # TypeScript check without emitting

# Testing (all test commands set DB_NAME=jobpostings_test automatically)
bun run test                   # Run all tests once
bun run test:unit              # Unit tests only (tests/unit/)
bun run test:integration       # Integration tests only (tests/integration/)
bun run test:watch             # Watch mode
bun run test:coverage          # With coverage report
# Run a single test file:
DB_NAME=jobpostings_test bunx vitest run tests/unit/services/typesense-queryBuilder.test.ts

# Database (Drizzle Kit)
bun run db:generate            # Generate migration from schema changes
bun run db:migrate             # Run migrations (dev DB)
bun run db:migrate-test        # Run migrations (test DB: jobpostings_test)
bun run db:push                # Push schema directly (no migration file)
bun run db:seed                # Seed database

# Infrastructure
bun run services:up            # Start MySQL, 3x Redis, Typesense via Docker Compose
bun run services:down          # Stop services
bun run services:purge         # Stop services and remove volumes/images
```

## Architecture

### Layered Pattern: Controller → Service → Repository

Each domain (users, jobs, organizations) follows this stack with base classes:

- **`BaseController`** (`src/controllers/base.controller.ts`) — Standardized response helpers (`sendSuccess`, `sendPaginatedResponse`, `handleControllerError`). All API responses follow `{ success, message, data, timestamp }` shape.
- **`BaseService`** (`src/services/base.service.ts`) — Result type pattern: services return `Result<T, E>` using `ok(value)` / `fail(error)` helpers instead of throwing. Controllers check `.isSuccess` / `.isFailure`.
- **`BaseRepository`** (`src/repositories/base.repository.ts`) — Generic CRUD over Drizzle tables. All DB calls wrapped with `withDbErrorHandling`.

### Key Patterns

- **Path aliases**: `@/` → `src/`, `@tests/` → `tests/` (configured in tsconfig.json and vitest.config.mts)
- **Validation**: Zod schemas in `src/validations/`, applied via `validate()` middleware which validates `{ body, query, params }` together
- **API docs**: OpenAPI generated from Zod schemas using `@asteasolutions/zod-to-openapi` registry (`src/swagger/registry.ts`), served at `/docs`
- **Environment**: All env vars validated with Zod at startup (`src/config/env.ts`). Test mode uses lenient fallbacks.
- **Error hierarchy**: Custom error classes in `src/utils/errors.ts` — `AppError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `DatabaseError`, `ValidationError`
- **Logging**: Pino logger (`src/logger/index.ts`)

### Background Workers (BullMQ)

Workers in `src/workers/` process async tasks via Redis-backed queues:

- `typesense-job-indexer` — Indexes jobs in Typesense on create/update
- `file-upload-worker` — Uploads files to Firebase Storage
- `send-email-worker` — Sends emails via Nodemailer
- `job-alert-processor` — Daily/weekly/monthly job alert matching
- `temp-file-cleanup-worker` — Cleans up temporary upload files
- `inactive-user-alert-pauser` — Pauses alerts for inactive users
- `invitation-expiration-worker` — Expires old organization invitations

### Database Schema

Drizzle schema files in `src/db/schema/`. Migrations output to `src/db/migrations/`. Key entities: users, organizations, jobsDetails, educations, workExperiences, certifications, sessions, subscriptions, jobAlerts.

### Testing

- Vitest with `pool: "forks"` + `singleFork: true` (sequential execution for DB safety)
- `tests/setup/globalSetup.ts` — Checks test DB connection
- `tests/setup/setupTests.ts` — Runs `cleanAll()` before each test for pristine state
- `tests/utils/` — Test helpers: `seedBuilders.ts` (factory builders), `seedScenarios.ts` (common setups), `fixtures.ts`, `testDatabase.ts`, `cleanAll.ts`
- Integration tests use supertest against the Express app
- Tests require Docker services running (`bun run services:up`) and test DB migrated (`bun run db:migrate-test`)

### Infrastructure Services (`src/infrastructure/`)

- `redis-cache.service.ts` / `cache.service.ts` — Caching with Redis, used via `cache.middleware.ts`
- `redis-rate-limiter.service.ts` — Redis-backed rate limiting
- `queue.service.ts` — BullMQ queue management
- `typesense.service/` — Search indexing and querying
- `email.service.ts` — Email sending via Nodemailer
- `firebase-upload.service.ts` — Firebase Storage uploads

### Docker Services (compose.yml)

| Service              | Port | Container          |
| -------------------- | ---- | ------------------ |
| MySQL 9.4            | 3306 | jobpostings-mysql  |
| Redis (cache)        | 6369 | redis-cache        |
| Redis (queue)        | 6359 | redis-queue        |
| Redis (rate-limiter) | 6389 | redis-rate-limiter |
| Typesense            | 8108 | typesense          |

### Routes

All API routes mounted at `/api` via `src/routes/index.ts`:

- `/api/users` — User profiles, education, work experience, certifications, job alerts
- `/api/jobs` — Job listings, applications, search
- `/api/organizations` — Organization management
- `/api/invitations` — Organization invitations
- `/api/auth/*` — Better-Auth routes (mounted directly in app.ts)
- `/health` — Health check endpoint
- `/docs` — Swagger UI

## Architecture Roadmap: Modular Monolith Refactoring

> **Full details**: `docs/ADR-0001-architecture-audit-and-modular-monolith-evaluation.md`

An architecture audit (2026-03-10) identified that the codebase uses **manual constructor instantiation** (not true DI), has **no domain boundary enforcement**, and suffers from **cross-domain coupling** and **God-class services**. The decision is to incrementally refactor toward a Modular Monolith.

### Current Status: Started — Phase 8 is next

### Execution Order (Azure Boards IDs)

| Phase | User Story ID | Title                                                                    | Priority | Est. |
| ----- | ------------- | ------------------------------------------------------------------------ | -------- | ---- |
| 0     | **955**       | Introduce interfaces/ports for repositories and services                 | P1       | 3-4d |
| 1     | **956**       | Extract shared kernel (Result type, errors, base classes, config)        | P1       | 2-3d |
| 2     | **957**       | Split UserService into identity, user-profile, and notifications modules | P2       | 4-5d |
| 3     | **958**       | Split JobService into job-board and applications modules                 | P2       | 3-4d |
| 4     | **959**       | Extract organizations and invitations into separate modules              | P2       | 2-3d |
| 5     | **960**       | Refactor AuthMiddleware — separate authentication from authorization     | P1       | 3-4d |
| 6     | **961**       | Introduce composition roots per module and remove manual instantiation   | P3       | 2-3d |
| 7     | **962**       | Add module-level public APIs (facades) and enforce import boundaries     | P3       | 2-3d |
| 8     | **963**       | Migrate workers to module-owned background processors                    | P3       | 2-3d |
| 9     | **964**       | Update all tests to use injected dependencies                            | P2       | 3-4d |

Each user story has child tasks in Azure Boards with detailed descriptions and acceptance criteria.

### Key Context for New Sessions

- **34 `new` calls** across the codebase create domain objects inside constructors — the core problem
- **Zero interfaces/ports** exist today — services and repositories are all concrete classes
- **AuthMiddleware** (798 lines, `src/middleware/auth.middleware.ts`) instantiates 5 dependencies across all 3 domains — the worst coupling hotspot
- **God classes**: `UserService` (1,365 lines), `OrganizationService` (1,045 lines), `UserRepository` (1,515 lines)
- **Cross-domain coupling**: every service imports repositories from at least one other domain
- **Target module structure**: `src/modules/{identity, user-profile, job-board, applications, organizations, invitations, notifications}` + `src/shared/`
- **Approach**: Incremental Strangler Fig — one module at a time, starting with most isolated
- **Azure DevOps**: `tech-team.job-board` project at `https://dev.azure.com/rumbani` — use `az boards` CLI to query/update work items
