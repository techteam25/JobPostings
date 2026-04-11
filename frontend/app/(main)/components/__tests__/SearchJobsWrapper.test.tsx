import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { SearchJobsWrapper } from "../SearchJobsWrapper";
import { useFiltersStore } from "@/context/store";
import { server } from "@/test/mocks/server";
import {
  SEARCH_URL,
  JOBS_URL,
  makePaginatedResponse,
  makeSearchResult,
  makeJobWithEmployer,
  makeJobsPaginatedResponse,
} from "@/test/mocks/handlers";
import type { JobWithEmployer } from "@/schemas/responses/jobs";
import type { PaginatedApiResponse } from "@/lib/types";

// Default to desktop layout so the list renders without responsive gating.
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

// Stub the detail panels — they fetch their own data and aren't relevant here.
vi.mock("../JobDetailPanel", () => ({
  JobDetailPanel: () => null,
}));
vi.mock("../JobDetailPanelMobile", () => ({
  JobDetailPanelMobile: () => null,
}));

// Controllable IntersectionObserver: tests drive visibility via `triggerIntersection`.
let observerCallback: IntersectionObserverCallback | null = null;
const observe = vi.fn();
const disconnect = vi.fn();
const unobserve = vi.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(cb: IntersectionObserverCallback) {
    observerCallback = cb;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = unobserve;
  takeRecords = () => [];
}

beforeAll(() => {
  (
    globalThis as unknown as {
      IntersectionObserver: typeof IntersectionObserver;
    }
  ).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

function triggerIntersection() {
  observerCallback?.(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

function resetStore() {
  useFiltersStore.setState({
    keyword: "",
    location: "",
    jobTypes: [],
    serviceRoles: [],
    remoteOnly: false,
    sortBy: "recent",
    datePosted: null,
  });
}

function makeInitialJobs(
  jobs: { id: number; title: string }[],
): PaginatedApiResponse<JobWithEmployer> {
  return {
    success: true,
    data: jobs.map((j) => ({
      hasApplied: false,
      hasSaved: false,
      job: {
        id: j.id,
        title: j.title,
        description: "Initial",
        city: "Austin",
        state: "TX",
        country: "USA",
        zipcode: null,
        jobType: "full-time",
        compensationType: "salary",
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
        name: "Initial Co",
        city: "Austin",
        state: "TX",
        logoUrl: null,
      } as unknown as JobWithEmployer["employer"],
    })),
    pagination: {
      total: jobs.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      nextPage: null,
      previousPage: null,
    },
  };
}

describe("SearchJobsWrapper", () => {
  beforeEach(() => {
    resetStore();
    observe.mockReset();
    disconnect.mockReset();
    unobserve.mockReset();
    observerCallback = null;
  });

  it("renders SSR jobs when no filters are active", () => {
    const initial = makeInitialJobs([
      { id: 1, title: "SSR Job One" },
      { id: 2, title: "SSR Job Two" },
    ]);

    render(<SearchJobsWrapper initialJobs={initial} />);

    expect(screen.getByText("SSR Job One")).toBeInTheDocument();
    expect(screen.getByText("SSR Job Two")).toBeInTheDocument();
  });

  it("switches to search results when keyword is set in store", async () => {
    server.use(
      http.get(SEARCH_URL, () => {
        return HttpResponse.json(
          makePaginatedResponse([
            makeSearchResult({ id: "100", title: "Search Result Job" }),
          ]),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(
      <SearchJobsWrapper
        initialJobs={makeInitialJobs([{ id: 1, title: "Hidden SSR" }])}
      />,
    );

    expect(await screen.findByText("Search Result Job")).toBeInTheDocument();
    expect(screen.queryByText("Hidden SSR")).not.toBeInTheDocument();
  });

  it("renders the empty state and the clear button resets the store", async () => {
    server.use(
      http.get(SEARCH_URL, () => HttpResponse.json(makePaginatedResponse([]))),
    );

    useFiltersStore.setState({
      keyword: "noresults",
      jobTypes: ["full-time"],
    });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    expect(await screen.findByText(/no matching jobs/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    const state = useFiltersStore.getState();
    expect(state.keyword).toBe("");
    expect(state.jobTypes).toEqual([]);
  });

  it("renders the error state when the API returns success: false", async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({
          success: false,
          message: "Backend down",
          errorCode: "INTERNAL",
        }),
      ),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retry button re-fetches after an error", async () => {
    let callCount = 0;
    server.use(
      http.get(SEARCH_URL, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({
            success: false,
            message: "First attempt failed",
            errorCode: "INTERNAL",
          });
        }
        return HttpResponse.json(
          makePaginatedResponse([
            makeSearchResult({ id: "1", title: "Recovered Job" }),
          ]),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Recovered Job")).toBeInTheDocument();
    expect(callCount).toBe(2);
  });

  it("sort state reflects Zustand sortBy value", async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          makePaginatedResponse([
            makeSearchResult({ id: "1", title: "Sort Test Job" }),
          ]),
        ),
      ),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    await screen.findByText("Sort Test Job");

    // Default sort is "recent"
    expect(useFiltersStore.getState().sortBy).toBe("recent");
    // Both mobile and desktop sort controls render "Most Recent"
    expect(screen.getAllByText("Most Recent").length).toBeGreaterThanOrEqual(1);
  });

  it("resets sortBy to recent when keyword is cleared while relevant is active", async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          makePaginatedResponse([
            makeSearchResult({ id: "1", title: "Reset Test" }),
          ]),
        ),
      ),
    );

    useFiltersStore.setState({ keyword: "react", sortBy: "relevant" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    await screen.findByText("Reset Test");

    // Clear keyword — setKeyword resets sortBy to "recent" when relevant is active
    useFiltersStore.getState().setKeyword("");

    await waitFor(() => {
      expect(useFiltersStore.getState().sortBy).toBe("recent");
    });
  });

  it("intersection observer triggers fetchNextPage when the sentinel is visible", async () => {
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const page = Number(
          new URL(request.url).searchParams.get("page") ?? "1",
        );
        if (page === 1) {
          return HttpResponse.json(
            makePaginatedResponse(
              [makeSearchResult({ id: "1", title: "Page One" })],
              { page: 1, totalPages: 2 },
            ),
          );
        }
        return HttpResponse.json(
          makePaginatedResponse(
            [makeSearchResult({ id: "2", title: "Page Two" })],
            { page: 2, totalPages: 2 },
          ),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    expect(await screen.findByText("Page One")).toBeInTheDocument();

    // The observer effect is registered after the first successful render.
    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });

    triggerIntersection();

    expect(await screen.findByText("Page Two")).toBeInTheDocument();
    expect(screen.getByText("Page One")).toBeInTheDocument();
  });

  it("default view: intersection observer triggers page 2 load on scroll", async () => {
    server.use(
      http.get(JOBS_URL, ({ request }) => {
        const page = Number(
          new URL(request.url).searchParams.get("page") ?? "1",
        );
        if (page === 1) {
          // Background refetch for page 1 — return same shape as SSR data.
          return HttpResponse.json(
            makeJobsPaginatedResponse(
              [makeJobWithEmployer({ id: 1, title: "SSR Default Job" })],
              { page: 1, totalPages: 2 },
            ),
          );
        }
        return HttpResponse.json(
          makeJobsPaginatedResponse(
            [makeJobWithEmployer({ id: 2, title: "Default Page 2" })],
            { page: 2, totalPages: 2 },
          ),
        );
      }),
    );

    const initial: PaginatedApiResponse<JobWithEmployer> = {
      success: true,
      data: [makeJobWithEmployer({ id: 1, title: "SSR Default Job" })],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
        nextPage: 2,
        previousPage: null,
      },
    };

    render(<SearchJobsWrapper initialJobs={initial} />);

    expect(screen.getByText("SSR Default Job")).toBeInTheDocument();

    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });

    triggerIntersection();

    expect(await screen.findByText("Default Page 2")).toBeInTheDocument();
    expect(screen.getByText("SSR Default Job")).toBeInTheDocument();
  });

  it("shows 'No more results' after all search pages are loaded", async () => {
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const page = Number(
          new URL(request.url).searchParams.get("page") ?? "1",
        );
        if (page === 1) {
          return HttpResponse.json(
            makePaginatedResponse(
              [makeSearchResult({ id: "1", title: "First Page" })],
              { page: 1, totalPages: 2 },
            ),
          );
        }
        return HttpResponse.json(
          makePaginatedResponse(
            [makeSearchResult({ id: "2", title: "Last Page" })],
            { page: 2, totalPages: 2 },
          ),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    render(<SearchJobsWrapper initialJobs={makeInitialJobs([])} />);

    expect(await screen.findByText("First Page")).toBeInTheDocument();

    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });

    triggerIntersection();

    expect(await screen.findByText("Last Page")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No more results")).toBeInTheDocument();
    });
  });

  it("shows 'No more results' after all default pages are loaded", async () => {
    server.use(
      http.get(JOBS_URL, ({ request }) => {
        const page = Number(
          new URL(request.url).searchParams.get("page") ?? "1",
        );
        if (page === 1) {
          return HttpResponse.json(
            makeJobsPaginatedResponse(
              [makeJobWithEmployer({ id: 1, title: "SSR Page 1" })],
              { page: 1, totalPages: 2 },
            ),
          );
        }
        return HttpResponse.json(
          makeJobsPaginatedResponse(
            [makeJobWithEmployer({ id: 2, title: "Job Page 2" })],
            { page: 2, totalPages: 2 },
          ),
        );
      }),
    );

    const initial: PaginatedApiResponse<JobWithEmployer> = {
      success: true,
      data: [makeJobWithEmployer({ id: 1, title: "SSR Page 1" })],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
        nextPage: 2,
        previousPage: null,
      },
    };

    render(<SearchJobsWrapper initialJobs={initial} />);

    expect(screen.getByText("SSR Page 1")).toBeInTheDocument();

    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });

    triggerIntersection();

    expect(await screen.findByText("Job Page 2")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No more results")).toBeInTheDocument();
    });
  });

  it("does not show 'No more results' when there is only one page", () => {
    const initial = makeInitialJobs([{ id: 1, title: "Only Page Job" }]);

    render(<SearchJobsWrapper initialJobs={initial} />);

    expect(screen.getByText("Only Page Job")).toBeInTheDocument();
    expect(screen.queryByText("No more results")).not.toBeInTheDocument();
  });
});
