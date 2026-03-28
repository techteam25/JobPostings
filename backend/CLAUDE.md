# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job Board backend API — Express.js 5 + TypeScript, running on Bun. Uses MySQL via Drizzle ORM, Redis (cache, queue, rate-limiting — three separate instances), BullMQ for background jobs, Typesense for full-text search, Firebase Storage for file uploads, and Better-Auth for authentication (Google/LinkedIn OAuth).

## Commands

**IMPORTANT: The user will always run Drizzle `generate` and `migrate` manually. Do not run these commands automatically.**


```bash
# Development
bun run dev                    # Start dev server with --watch (port from .env, default 5500)
bun run build                  # Build with bun targeting bun runtime
bun run type-check             # TypeScript check without emitting
bun run lint                   # ESLint check
bun run lint:fix               # ESLint auto-fix

# Testing (all test commands set DB_NAME=jobpostings_test automatically)
bun run test                   # Run all tests once
bun run test:unit              # Unit tests only (tests/unit/)
bun run test:integration       # Integration tests only (tests/integration/)
bun run test:watch             # Watch mode
bun run test:ui                # Vitest UI
bun run test:coverage          # With coverage report
bun run test:arch              # Architecture boundary tests
# Run a single test file:
DB_NAME=jobpostings_test bunx vitest run tests/unit/services/typesense-queryBuilder.test.ts

# Database (Drizzle Kit)
bun run db:generate            # Generate migration from schema changes
bun run db:migrate             # Run migrations (dev DB)
bun run db:migrate-test        # Run migrations (test DB: jobpostings_test)
bun run db:push                # Push schema directly (no migration file)
bun run db:studio              # Open Drizzle Studio
bun run db:drop                # Drop database
bun run db:seed                # Seed database

# Typesense
bun run typesense:migrate          # Migrate Typesense schema
bun run typesense:migrate:status   # Check Typesense migration status

# Infrastructure
bun run services:up            # Start MySQL, 3x Redis, Typesense via Docker Compose
bun run services:down          # Stop services
bun run services:purge         # Stop services and remove volumes/images
```

## Architecture

### Modular Monolith: Module → Controller → Service → Repository

Seven bounded contexts live in `src/modules/{name}/`: `applications`, `identity`, `invitations`, `job-board`, `notifications`, `organizations`, `user-profile`. Each has its own composition root, controller, service, repository, port interfaces, and guards:

- **`BaseController`** (`src/shared/base/base.controller.ts`) — Standardized response helpers (`sendSuccess`, `sendPaginatedResponse`, `handleControllerError`). All API responses follow `{ success, message, data, timestamp }` shape.
- **`BaseService`** (`src/shared/base/base.service.ts`) — Result type pattern: services return `Result<T, E>` using `ok(value)` / `fail(error)` helpers instead of throwing. Controllers check `.isSuccess` / `.isFailure`.
- **`BaseRepository`** (`src/shared/base/base.repository.ts`) — Generic CRUD over Drizzle tables. All DB calls wrapped with `withDbErrorHandling`.
- **Composition roots** — Each module has a `composition-root.ts` that receives dependencies via interface ports. The central `src/composition-root.ts` instantiates all concrete classes and wires cross-module adapters.

### Key Patterns

- **Path aliases**: `@/` → `src/`, `@shared/` → `src/shared/`, `@tests/` → `tests/` (configured in tsconfig.json and vitest.config.mts)
- **Validation**: Zod schemas in `src/validations/`, applied via `validate()` middleware which validates `{ body, query, params }` together
- **API docs**: OpenAPI generated from Zod schemas using `@asteasolutions/zod-to-openapi` registry (`src/swagger/registry.ts`), served at `/docs`
- **Environment**: All env vars validated with Zod at startup (`src/shared/config/env.ts`). Test mode uses lenient fallbacks.
- **Error hierarchy**: Custom error classes in `src/shared/errors/` — `AppError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `DatabaseError`, `ValidationError`
- **Logging**: Pino logger (`src/shared/logger/index.ts`)

### Background Workers (BullMQ)

Workers process async tasks via Redis-backed queues. Shared workers live in `src/shared/workers/`; module-specific workers live in their owning module's `workers/` directory:

- `typesense-job-indexer` — Indexes jobs in Typesense on create/update (`src/modules/job-board/workers/`)
- `file-upload-worker` — Uploads files to Firebase Storage (`src/shared/workers/`)
- `send-email-worker` — Sends emails via Nodemailer (`src/modules/notifications/workers/`)
- `job-alert-processor` — Daily/weekly/monthly job alert matching (`src/modules/notifications/workers/`)
- `temp-file-cleanup-worker` — Cleans up temporary upload files (`src/shared/workers/`)
- `inactive-user-alert-pauser` — Pauses alerts for inactive users (`src/modules/notifications/workers/`)
- `invitation-expiration-worker` — Expires old organization invitations (`src/modules/invitations/workers/`)
- `domain-event-worker` — Routes domain events to handlers (`src/shared/workers/`)

### Database Schema

Drizzle schema files in `src/db/schema/`. Migrations output to `src/db/migrations/`. Key entities: user, userProfile, userSkills, userOnBoarding, userEmailPreferences, emailPreferenceAuditLog, organizations, organizationMembers, organizationInvitations, jobsDetails, jobApplications, applicationNotes, jobInsights, skills, jobSkills, savedJobs, educations, workExperiences, certifications, userCertifications, session, account, verification, subscriptions, jobAlerts, jobAlertMatches, jobPreferences.

### Testing

- Vitest with `pool: "forks"` + `singleFork: true` (sequential execution for DB safety)
- Coverage thresholds: 80% minimum (branches, functions, lines, statements)
- Test timeout: 10 seconds
- `tests/setup/globalSetup.ts` — Checks test DB connection, sets `NODE_ENV=test` and `PORT=0`
- `tests/setup/setupTests.ts` — Runs `cleanAll()` before each test, mocks `queueService` and `EmailService` globally
- `tests/utils/` — Test helpers: `seedBuilders.ts` (factory builders), `seedScenarios.ts` (common setups), `fixtures.ts` (Faker.js generators), `testDatabase.ts`, `cleanAll.ts`, `testHelpers.ts` (supertest instance + API validators), `wait-for-jobIndexer.ts` (Typesense polling)
- Integration tests use supertest against the Express app
- Tests require Docker services running (`bun run services:up`) and test DB migrated (`bun run db:migrate-test`)

### Infrastructure Services (`src/shared/infrastructure/`)

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

- `/api/users` — User profiles, education, work experience, certifications, job alerts, saved jobs, email preferences, job preferences
- `/api/jobs` — Job listings, applications, search, employer job management and stats
- `/api/organizations` — Organization management, member invitations, application review and notes
- `/api/invitations` — Organization invitation details and acceptance
- `/api/auth/*` — Better-Auth routes (mounted directly in app.ts)
- `/health` — Health check endpoint
- `/docs` — Swagger UI

## Architecture Decision Records

- `docs/ADR-0001-architecture-audit-and-modular-monolith-evaluation.md` — Architecture audit and modular monolith evaluation
- `docs/ADR-0002-cross-domain-communication.md` — Cross-domain communication: Query Facade (ACL) for sync reads, Domain Events (BullMQ) for async writes