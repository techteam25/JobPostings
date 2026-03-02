# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `bun dev` (uses Next.js with Turbopack)
- **Build:** `bun run build`
- **Lint:** `bun run lint`
- **Format:** Prettier with `prettier-plugin-tailwindcss` (see `prettier.config.mjs`)

No test runner is configured in this project.

## Architecture

This is the **frontend** of **getINvolved**, a job board platform connecting missions organizations with talent. It's a Next.js 16 app (App Router) with React 18, TypeScript, and Tailwind CSS v4.

### Backend Communication

The frontend is a client to a separate backend API. All server URLs come from `env.ts` (uses `@t3-oss/env-nextjs` for type-safe env vars):
- `NEXT_PUBLIC_SERVER_URL` — backend API base URL
- `NEXT_PUBLIC_FRONTEND_URL` — this app's URL

Two patterns for API calls:
- **Server Actions / Server Components:** `lib/api.ts` — `"use server"` functions using `fetch` with `cookies()` for auth. Used for SSR data fetching with Next.js caching (`revalidate`, `tags`).
- **Client-side:** `lib/axios-instance.ts` — Axios instance with `withCredentials: true`. Used with TanStack React Query (configured in `providers/index.tsx`).

### Authentication

Uses **better-auth** with cookie-based sessions. The backend owns auth; the frontend proxies:
- `lib/auth.ts` — client-side auth via `createAuthClient` (points to `SERVER_URL/auth`)
- `lib/auth-server.ts` — server-side session check for middleware/server components (Edge Runtime compatible)
- `middleware.ts` — protects routes, redirects unauthenticated users to `/sign-in`, handles onboarding flow based on user intent (employer vs seeker) and status (pending vs completed)

### Route Structure

- `app/(auth)/` — sign-in, sign-up pages with shared auth layout
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
- **Tiptap** — rich text editor
- **@dnd-kit** — drag and drop
- **Sonner** — toast notifications
- **Vaul** — drawer component
- Fonts: Poppins and Montserrat (via `next/font`)

### Schemas

`schemas/` contains Zod schemas organized by domain: `jobs/`, `organizations/`, `applications/`, `auth/`, `invitations/`, `job-alerts/`, and `responses/` (API response types). Response types are also defined in `lib/types.ts`.

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

### Collocated Code Pattern

Route-specific components and hooks live alongside their routes (e.g., `app/(main)/components/`, `app/(main)/hooks/`, `app/employer/organizations/hooks/`). Shared components go in top-level `components/` and hooks in `hooks/`.
