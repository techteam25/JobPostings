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
 * cannot be targeted with a prefix glob — a naive `invalidate` would
 * prefix-collide (`...:user:1` also matches `...:user:12`). To evict ONE
 * user's entries use either an EXACT `CacheService.del(userScoped(base, id))`
 * (single known key) or `userScopedPattern(base, id)` (all of the user's
 * keys under `base`, any query string): its embedded `*` tells
 * `CacheService.invalidate` to use the pattern as-is instead of appending a
 * trailing `*`, so the `:user:<id>` suffix stays anchored to the key end.
 */

/** Base key for a request: path with the `/api/` mount prefix stripped. */
export const pathKey = (req: Request): string =>
  (req.originalUrl || req.url).replace(/^\/api\//, "");

/** Append the per-user suffix for authenticated, user-specific responses. */
export const userScoped = (base: string, userId?: number): string =>
  userId ? `${base}:user:${userId}` : base;

/**
 * Suffix-anchored eviction pattern for ONE user's keys under `base`
 * (matches `cache:<base>…:user:<id>` exactly — no `:user:12` collision when
 * targeting user 1). Falls back to the broad prefix glob when no userId is
 * available, which over-evicts but never leaves stale entries.
 */
export const userScopedPattern = (base: string, userId?: number): string =>
  userId ? `${base}*:user:${userId}` : base;

/**
 * Eviction pattern for ONE user's recommendations ("For You") keys.
 *
 * Unlike the user-SUFFIX keys handled by `userScopedPattern`, the
 * recommendations key puts `:user:<id>` in the MIDDLE
 * (`recommendations:user:<id>:page:<n>:limit:<n>`), so a suffix-anchored
 * pattern would never match. This anchors on the `…:user:<id>:` PREFIX and
 * wildcards the pagination tail, evicting every page/limit variant for the
 * user. The embedded `*` tells `CacheService.invalidate` to use the pattern
 * as-is (no trailing `*` appended). Falls back to the broad base prefix glob
 * when no userId is available, which over-evicts but never leaves stale
 * entries.
 */
export const recommendationsPattern = (
  base: string,
  userId?: number,
): string => (userId ? `${base}:user:${userId}:*` : base);

export const cacheKeys = {
  // ─── Job board ────────────────────────────────────────────────────
  jobs: "jobs",

  // ─── Recommendations ──────────────────────────────────────────────
  // Base for the "For You" per-user key
  // (`recommendations:user:<id>:page:<n>:limit:<n>`), kept out of the
  // `jobs` namespace. The `:user:<id>` segment is in the MIDDLE of the key,
  // so evict one user's entries with
  // `recommendationsPattern(cacheKeys.recommendations, req.userId)` — NOT
  // `userScopedPattern`, which is suffix-anchored and would match nothing.
  recommendations: "recommendations",

  // ─── Applications ─────────────────────────────────────────────────
  seekerApplications: "jobs/me/applications",
  orgJobApplications: (orgId: string | number, jobId: string | number) =>
    `organizations/${orgId}/jobs/${jobId}/applications`,
  orgApplications: (orgId: string | number) =>
    `organizations/${orgId}/applications`,

  // ─── Organizations ────────────────────────────────────────────────
  organizations: "organizations",
  orgMembersOfUser: (userId: number | undefined) =>
    `organizations/members/${userId}`,

  // ─── User profile ─────────────────────────────────────────────────
  userProfile: "users/me",
  userIntent: "users/me/intent",
  userOrganizations: "users/me/organizations",
  userSavedJobs: "users/me/saved-jobs",
} as const;
