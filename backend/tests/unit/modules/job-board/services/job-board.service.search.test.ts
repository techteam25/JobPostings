import { beforeEach, describe, expect, it, vi } from "vitest";

import { JobBoardService } from "@/modules/job-board/services/job-board.service";
import type {
  ApplicationStatusQueryPort,
  JobBoardRepositoryPort,
  JobInsightsRepositoryPort,
  OrgMembershipForJobPort,
  SavedJobsStatusQueryPort,
  UserContactQueryPort,
} from "@/modules/job-board";
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import type { SearchParams } from "@/validations/base.validation";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { JobDocumentType } from "@/validations/base.validation";

type SortBy = SearchParams["query"]["sortBy"];

const SEARCH_RESPONSE = {} as SearchResponse<JobDocumentType>;

function makeFilters(
  overrides: Partial<SearchParams["query"]> = {},
): SearchParams["query"] {
  return { q: "engineer", page: 1, limit: 10, ...overrides };
}

describe("JobBoardService search sorting", () => {
  let service: JobBoardService;
  let searchJobsCollection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    searchJobsCollection = vi.fn().mockResolvedValue(SEARCH_RESPONSE);
    const typesenseService = {
      searchJobsCollection,
    } as unknown as TypesenseJobServicePort;

    service = new JobBoardService(
      {} as JobBoardRepositoryPort,
      {} as JobInsightsRepositoryPort,
      typesenseService,
      {} as ApplicationStatusQueryPort,
      {} as SavedJobsStatusQueryPort,
      {} as OrgMembershipForJobPort,
      {} as UserContactQueryPort,
    );
  });

  const explicitSorts: ReadonlyArray<
    [SortBy, "createdAt" | "title", "asc" | "desc"]
  > = [
    ["date_posted_desc", "createdAt", "desc"],
    ["date_posted_asc", "createdAt", "asc"],
    ["title_asc", "title", "asc"],
    ["title_desc", "title", "desc"],
    ["recent", "createdAt", "desc"],
  ];

  it.each(explicitSorts)(
    "maps %s to %s:%s",
    async (sortBy, expectedSortBy, expectedDirection) => {
      await service.searchJobs(makeFilters({ sortBy }));

      expect(searchJobsCollection).toHaveBeenCalledWith(
        "engineer",
        expect.any(String),
        expect.objectContaining({
          sortBy: expectedSortBy,
          sortDirection: expectedDirection,
        }),
      );
    },
  );

  it.each(["relevant", "relevance"] as const)(
    "uses text relevance for %s when a query is present",
    async (sortBy) => {
      await service.searchJobs(makeFilters({ sortBy }));

      expect(searchJobsCollection).toHaveBeenCalledWith(
        "engineer",
        expect.any(String),
        expect.objectContaining({ sortBy: undefined, sortDirection: "desc" }),
      );
    },
  );

  it("defaults to newest-first when sortBy is omitted", async () => {
    await service.searchJobs(makeFilters({ sortBy: undefined }));

    expect(searchJobsCollection).toHaveBeenCalledWith(
      "engineer",
      expect.any(String),
      expect.objectContaining({ sortBy: "createdAt", sortDirection: "desc" }),
    );
  });

  it("falls back to newest-first when relevance is requested without a query", async () => {
    await service.searchJobs(
      makeFilters({ q: undefined, sortBy: "relevance" }),
    );

    expect(searchJobsCollection).toHaveBeenCalledWith(
      undefined,
      expect.any(String),
      expect.objectContaining({ sortBy: "createdAt", sortDirection: "desc" }),
    );
  });
});
