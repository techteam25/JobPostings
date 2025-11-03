// Available cache namespaces/services
export type CacheNamespace =
  | "jobs"
  | "jobApplications"
  | "users"
  | "organizations"
  | "profiles"
  | "jobInsights"
  | "search";

// Cache key operations
export type CacheOperation =
  | "active"
  | "inactive"
  | "detail"
  | "list"
  | "stats"
  | "dashboard"
  | "count";

/**
 * Base cache key pattern: namespace:operation:identifier
 * Examples:
 * - "jobs:active:1:10" (page 1, limit 10)
 * - "jobs:detail:123"
 * - "jobApplications:list:user:456"
 * - "organizations:detail:789"
 * - "users:profile:123"
 */
export type CacheKey = `${CacheNamespace}:${string}`;

/**
 * Cache key pattern for invalidation (supports wildcards)
 * Examples:
 * - "jobs:active:*"
 * - "jobApplications:*"
 * - "users:profile:*"
 */
export type CachePattern = `${CacheNamespace}:${string}`;

// Helper type for cache key builders
export type CacheKeyBuilder = {
  jobs: {
    active: (page: number, limit: number) => CacheKey;
    detail: (jobId: number) => CacheKey;
    byEmployer: (employerId: number, page: number, limit: number) => CacheKey;
  };
  jobApplications: {
    byJob: (jobId: number, page: number, limit: number) => CacheKey;
    byUser: (userId: number, page: number, limit: number) => CacheKey;
    detail: (applicationId: number) => CacheKey;
  };
  users: {
    detail: (userId: number) => CacheKey;
    profile: (userId: number) => CacheKey;
    dashboard: (userId: number) => CacheKey;
  };
  organizations: {
    detail: (organizationId: number) => CacheKey;
    byContact: (userId: number) => CacheKey;
    dashboard: (organizationId: number) => CacheKey;
  };
  jobInsights: {
    byJob: (jobId: number) => CacheKey;
    byOrganization: (organizationId: number) => CacheKey;
  };
  search: {
    results: (queryHash: string) => CacheKey;
  };
};

// Cache key factory for consistent key generation
export const CacheKeys: CacheKeyBuilder = {
  jobs: {
    active: (page, limit) => `jobs:active:${page}:${limit}`,
    detail: (jobId) => `jobs:detail:${jobId}`,
    byEmployer: (employerId, page, limit) =>
      `jobs:employer:${employerId}:${page}:${limit}`,
  },
  jobApplications: {
    byJob: (jobId, page, limit) =>
      `jobApplications:job:${jobId}:${page}:${limit}`,
    byUser: (userId, page, limit) =>
      `jobApplications:user:${userId}:${page}:${limit}`,
    detail: (applicationId) => `jobApplications:detail:${applicationId}`,
  },
  users: {
    detail: (userId) => `users:detail:${userId}`,
    profile: (userId) => `users:profile:${userId}`,
    dashboard: (userId) => `users:dashboard:${userId}`,
  },
  organizations: {
    detail: (organizationId) => `organizations:detail:${organizationId}`,
    byContact: (userId) => `organizations:contact:${userId}`,
    dashboard: (organizationId) => `organizations:dashboard:${organizationId}`,
  },
  jobInsights: {
    byJob: (jobId) => `jobInsights:job:${jobId}`,
    byOrganization: (organizationId) =>
      `jobInsights:organization:${organizationId}`,
  },
  search: {
    results: (queryHash) => `search:results:${queryHash}`,
  },
};

// Cache invalidation patterns
export const CachePatterns = {
  jobs: {
    all: "jobs:*" as CachePattern,
    active: "jobs:active:*" as CachePattern,
    byEmployer: (employerId: number) =>
      `jobs:employer:${employerId}:*` as CachePattern,
  },
  jobApplications: {
    all: "jobApplications:*" as CachePattern,
    byJob: (jobId: number) => `jobApplications:job:${jobId}:*` as CachePattern,
    byUser: (userId: number) =>
      `jobApplications:user:${userId}:*` as CachePattern,
  },
  users: {
    all: "users:*" as CachePattern,
    byUser: (userId: number) => `users:*:${userId}` as CachePattern,
  },
  organizations: {
    all: "organizations:*" as CachePattern,
    byOrganization: (organizationId: number) =>
      `organizations:*:${organizationId}` as CachePattern,
  },
  jobInsights: {
    all: "jobInsights:*" as CachePattern,
  },
  search: {
    all: "search:*" as CachePattern,
  },
} as const;