import { http, HttpResponse } from "msw";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";
import type { PaginatedApiResponse } from "@/lib/types";

import { env } from "./env";

/**
 * Base URL the `searchJobs` server action hits. Must match the mocked env
 * value in `test/mocks/env.ts` — MSW intercepts by exact origin + path.
 */
const SEARCH_URL = `${env.NEXT_PUBLIC_SERVER_URL}/jobs/search`;

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
];

export { SEARCH_URL };
