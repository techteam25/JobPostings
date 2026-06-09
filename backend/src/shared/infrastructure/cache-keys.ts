import type { Request } from "express";

/**
 * Single source of truth for HTTP-response cache key + invalidation pattern
 * strings.
 *
 * Read side  (`cacheMiddleware`): a GET response is stored under
 *   `cache:` + `userScoped(pathKey(req), req.userId)`.
 * Write side (`invalidateCacheMiddleware`): patterns are matched as a prefix
 * glob (`cache:<pattern>*`), so a write pattern only needs to be a prefix of
 * the read keys it should evict.
 *
 * Co-locating both sides here prevents the read/write drift that silently
 * breaks invalidation when a route path or key shape changes (the class of
 * bug that the stale `/api/`-prefixed patterns used to cause).
 *
 * NOTE: the `:user:<id>` suffix is appended at the END of the key, so it
 * cannot be targeted with a prefix glob. To evict a single user's entry use
 * an EXACT `CacheService.del(userScoped(base, id))` — never `invalidate`,
 * which would prefix-collide (`...:user:1` also matches `...:user:12`).
 */

/** Base key for a request: path with the `/api/` mount prefix stripped. */
export const pathKey = (req: Request): string =>
  (req.originalUrl || req.url).replace(/^\/api\//, "");

/** Append the per-user suffix for authenticated, user-specific responses. */
export const userScoped = (base: string, userId?: number): string =>
  userId ? `${base}:user:${userId}` : base;

export const cacheKeys = {
  // ─── Job board ────────────────────────────────────────────────────
  jobs: "jobs",
  job: (jobId: string | number) => `jobs/${jobId}`,

  // ─── Applications ─────────────────────────────────────────────────
  seekerApplications: "jobs/me/applications",
  orgJobApplications: (orgId: string | number, jobId: string | number) =>
    `organizations/${orgId}/jobs/${jobId}/applications`,
  orgApplications: (orgId: string | number) =>
    `organizations/${orgId}/applications`,

  // ─── Organizations ────────────────────────────────────────────────
  organizations: "organizations",
  organization: (orgId: string | number) => `organizations/${orgId}`,
  orgMembersOfUser: (userId: number | undefined) =>
    `organizations/members/${userId}`,

  // ─── User profile ─────────────────────────────────────────────────
  userProfile: "users/me",
  userIntent: "users/me/intent",
  userOrganizations: "users/me/organizations",
  userSavedJobs: "users/me/saved-jobs",
} as const;
