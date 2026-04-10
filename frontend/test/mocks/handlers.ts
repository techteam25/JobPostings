import { http, HttpResponse } from "msw";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";
import type { JobWithEmployer } from "@/schemas/responses/jobs";
import type { PaginatedApiResponse } from "@/lib/types";

import { env } from "./env";

/**
 * Base URLs for MSW interception. Must match the mocked env value in
 * `test/mocks/env.ts` — MSW intercepts by exact origin + path.
 */
const SEARCH_URL = `${env.NEXT_PUBLIC_SERVER_URL}/jobs/search`;
const JOBS_URL = `${env.NEXT_PUBLIC_SERVER_URL}/jobs`;

export function makeJobWithEmployer(
  overrides: { id?: number; title?: string } = {},
): JobWithEmployer {
  const id = overrides.id ?? 1;
  return {
    hasApplied: false,
    hasSaved: false,
    job: {
      id,
      title: overrides.title ?? "Default Job",
      description: "A great job opportunity",
      city: "Austin",
      state: "TX",
      country: "USA",
      zipcode: null,
      jobType: "full-time",
      compensationType: "paid",
      isRemote: false,
      isActive: true,
      applicationDeadline: null,
      experience: "Senior",
      employerId: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    } as unknown as JobWithEmployer["job"],
    employer: {
      id: 1,
      name: "Acme Corp",
      city: "Austin",
      state: "TX",
      logoUrl: null,
    } as unknown as JobWithEmployer["employer"],
  };
}

export function makeJobsPaginatedResponse(
  data: JobWithEmployer[],
  {
    page = 1,
    totalPages = 1,
    total = data.length,
  }: { page?: number; totalPages?: number; total?: number } = {},
): PaginatedApiResponse<JobWithEmployer> {
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit: 10,
      totalPages,
      hasNext,
      hasPrevious,
      nextPage: hasNext ? page + 1 : null,
      previousPage: hasPrevious ? page - 1 : null,
    },
  };
}

export function makeSearchResult(
  overrides: Partial<SearchJobResult> = {},
): SearchJobResult {
  return {
    id: "1",
    title: "Senior Engineer",
    company: "Acme Corp",
    description: "Build great things",
    city: "Austin",
    state: "TX",
    country: "USA",
    isRemote: false,
    experience: "Senior",
    jobType: "full-time",
    skills: ["TypeScript"],
    createdAt: Date.parse("2025-01-01"),
    logoUrl: undefined,
    ...overrides,
  };
}

export function makePaginatedResponse(
  data: SearchJobResult[],
  {
    page = 1,
    totalPages = 1,
    total = data.length,
  }: { page?: number; totalPages?: number; total?: number } = {},
): PaginatedApiResponse<SearchJobResult> {
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit: 10,
      totalPages,
      hasNext,
      hasPrevious,
      nextPage: hasNext ? page + 1 : null,
      previousPage: hasPrevious ? page - 1 : null,
    },
  };
}

/**
 * Default handlers — return an empty result so tests that don't opt into a
 * specific response don't throw on network errors. Individual tests override
 * via `server.use(...)` with a handler tailored to the case under test.
 */
export const handlers = [
  http.get(SEARCH_URL, () => {
    return HttpResponse.json(makePaginatedResponse([]));
  }),
  http.get(JOBS_URL, () => {
    return HttpResponse.json(makeJobsPaginatedResponse([]));
  }),
];

export { SEARCH_URL, JOBS_URL };
