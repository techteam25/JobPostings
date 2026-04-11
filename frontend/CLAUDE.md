# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `bun dev` (uses Next.js with Turbopack)
- **Build:** `bun run build`
- **Type check + lint:** `bun run type-check` (runs `tsc --noEmit && bun run lint`)
- **Lint:** `bun run lint`
- **Lint fix:** `bun run lint:fix`
- **Format:** `bun run format` (Prettier with `prettier-plugin-tailwindcss`, see `prettier.config.mjs`)
- **Bundle analyze:** `bun run analyze` (sets `ANALYZE=true` and builds)
- **Test:** `bun run test` (Vitest with jsdom environment)
- **Test watch:** `bun run test:watch`
- **Test coverage:** `bun run test:coverage`
- **Test UI:** `bun run test:ui`
- **E2E tests:** `bun run test:e2e` (Playwright)
- **E2E with UI:** `bun run test:e2e:ui`
- **E2E headed:** `bun run test:e2e:headed`
- **Run a single test file:** `bunx vitest run app/(main)/me/profile/qualifications/components/__tests__/CertificationCard.test.tsx`

## Architecture

This is the **frontend** of **getINvolved**, a job board platform connecting missions organizations with talent. It's a Next.js 16 app (App Router) with React 18, TypeScript, and Tailwind CSS v4.

### Backend Communication

The frontend is a client to a separate backend API. All server URLs come from `env.ts` (uses `@t3-oss/env-nextjs` for type-safe env vars):
- `NEXT_PUBLIC_SERVER_URL` — backend API base URL
- `NEXT_PUBLIC_FRONTEND_URL` — this app's URL

Two patterns for API calls:
- **Server Actions / Server Components:** `lib/api/` — modular `"use server"` functions using `fetch` with `cookies()` for auth. Organized by domain (jobs, organizations, applications, users, saved-jobs, preferences, invitations). Barrel-exported from `lib/api/index.ts`. Used for SSR data fetching with Next.js caching (`revalidate`, `tags`).
- **Client-side:** `lib/axios-instance.ts` — Axios instance with `withCredentials: true`, 401 response interceptor. Used with TanStack React Query (configured in `providers/index.tsx` with 60s stale time, 5min cache).

### Authentication

Uses **better-auth** with cookie-based sessions. The backend owns auth; the frontend proxies:
- `lib/auth.ts` — client-side auth via `createAuthClient` (points to `SERVER_URL/auth`)
- `lib/auth-server.ts` — server-side session check for middleware/server components (Edge Runtime compatible)
- `middleware.ts` — protects routes, redirects unauthenticated users to `/sign-in`, handles onboarding flow based on user intent (employer vs seeker) and status (pending vs completed)

### Route Structure

- `app/(auth)/` — sign-in, sign-up, verify-email, email-verified, forgot-password, reset-password with shared auth layout
- `app/(main)/` — job seeker experience: job listings, applications, saved jobs, settings, profile (`me/`)
- `app/employer/` — employer experience: onboarding, organization dashboard (`organizations/[id]/`)
- `app/invitations/` — organization invitation acceptance flow
- `app/unsubscribe/` — email unsubscribe

### State Management

- **Zustand** (`context/store.ts`) — client-side filter state (job type, date posted, remote, service role, sort). Uses slice pattern with files in `context/slices/`. Also stores for saved jobs and application form state.
- **TanStack React Query** — server state caching for client components

### UI Stack

- **shadcn/ui** (new-york style, Radix primitives) — components in `components/ui/`, configured via `components.json`
- **Lucide React** — icons
- **@tanstack/react-form** + **@tanstack/zod-form-adapter** — form management (used across org, profile, job alert, and preference forms)
- **Tiptap** — rich text editor
- **@dnd-kit** — drag and drop
- **cmdk** — command menu component
- **next-themes** — theme switching (class-based, system default)
- **react-day-picker** — date picker (used in shadcn calendar)
- **date-fns** — date utilities
- **isomorphic-dompurify** — HTML sanitization
- **Sonner** — toast notifications
- **Vaul** — drawer component
- Fonts: Poppins and Montserrat (via `next/font`)

## Skills to use during implementation:
- `frontend-design` skill (`frontend/.claude/skills/frontend-design/SKILL.md`) — for all new UI components.
`shadcn` skill (f`rontend/.agents/skills/shadcn/SKILL.md`) — for component composition, form inputs, styling rules. Follow shadcn composition rules (use `cn()`, semantic colors, `gap-*` not `space-*`, etc.)

### Schemas

`schemas/` contains Zod 4 schemas organized by domain: `auth/`, `jobs/`, `organizations/`, `applications/`, `invitations/`, `job-alerts/`, `job-preferences/`, `educations/`, `work-experiences/`, and `responses/` (API response types). Response types are also defined in `lib/types.ts`.

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

### Testing

- **Vitest** with jsdom environment, configured in `vitest.config.ts`
- `test/setup.ts` — global setup with jest-dom matchers and Radix UI polyfills (ResizeObserver, PointerEvent)
- `test/test-utils.tsx` — custom render function wrapping components with QueryClientProvider
- `test/mocks/` — mock modules (env, next-navigation)
- `test/fixtures/` — test data fixtures
- **MSW** (`msw@2`) — installed for API mocking
- **Playwright** for E2E tests

### Collocated Code Pattern

Route-specific components and hooks live alongside their routes (e.g., `app/(main)/components/`, `app/(main)/hooks/`, `app/employer/organizations/hooks/`). Shared components go in top-level `components/` and hooks in `hooks/`.
