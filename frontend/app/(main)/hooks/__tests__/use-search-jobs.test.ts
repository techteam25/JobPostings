import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { type ReactNode, createElement } from "react";

import { useSearchJobs } from "../use-search-jobs";
import { useFiltersStore } from "@/context/store";
import { server } from "@/test/mocks/server";
import {
  SEARCH_URL,
  makePaginatedResponse,
  makeSearchResult,
} from "@/test/mocks/handlers";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  }
  return Wrapper;
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

describe("useSearchJobs", () => {
  beforeEach(() => {
    resetStore();
  });

  it("does not fire a request when no filters are set (enabled=false)", async () => {
    let callCount = 0;
    server.use(
      http.get(SEARCH_URL, () => {
        callCount += 1;
        return HttpResponse.json(makePaginatedResponse([]));
      }),
    );

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    // Let React Query settle; nothing should be requested.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(callCount).toBe(0);
    expect(result.current.data).toBeUndefined();
  });

  it("sends the keyword as the `q` query param", async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(
          makePaginatedResponse([makeSearchResult({ id: "1" })]),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).not.toBeNull();
    expect(capturedUrl!.searchParams.get("q")).toBe("react");
    expect(capturedUrl!.searchParams.get("page")).toBe("1");
  });

  it("serializes jobTypes as repeated query params", async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(makePaginatedResponse([]));
      }),
    );

    useFiltersStore.setState({
      keyword: "engineer",
      jobTypes: ["full-time", "contract"],
    });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl!.searchParams.getAll("jobType")).toEqual([
      "full-time",
      "contract",
    ]);
  });

  it("parses the raw location string into city/state/zipcode params", async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(makePaginatedResponse([]));
      }),
    );

    useFiltersStore.setState({
      keyword: "designer",
      location: "Boston, MA, 02101",
    });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl!.searchParams.get("city")).toBe("Boston");
    expect(capturedUrl!.searchParams.get("state")).toBe("MA");
    expect(capturedUrl!.searchParams.get("zipcode")).toBe("02101");
  });

  it("surfaces an error when the backend responds with success: false", async () => {
    server.use(
      http.get(SEARCH_URL, () => {
        return HttpResponse.json({
          success: false,
          message: "Backend exploded",
          errorCode: "INTERNAL",
        });
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Backend exploded");
  });

  it("reports hasNextPage=true when the response pagination has more pages", async () => {
    server.use(
      http.get(SEARCH_URL, () => {
        return HttpResponse.json(
          makePaginatedResponse([makeSearchResult({ id: "1" })], {
            page: 1,
            totalPages: 3,
            total: 25,
          }),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it("reports hasNextPage=false when pagination.hasNext is false", async () => {
    server.use(
      http.get(SEARCH_URL, () => {
        return HttpResponse.json(
          makePaginatedResponse([makeSearchResult({ id: "1" })], {
            page: 1,
            totalPages: 1,
          }),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetchNextPage sends the next page param and appends the results", async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        requestedPages.push(page);
        if (page === 1) {
          return HttpResponse.json(
            makePaginatedResponse(
              [makeSearchResult({ id: "1", title: "Page 1 Job" })],
              { page: 1, totalPages: 2 },
            ),
          );
        }
        return HttpResponse.json(
          makePaginatedResponse(
            [makeSearchResult({ id: "2", title: "Page 2 Job" })],
            { page: 2, totalPages: 2 },
          ),
        );
      }),
    );

    useFiltersStore.setState({ keyword: "react" });

    const { result } = renderHook(() => useSearchJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });

    // Fire and forget — React Query schedules the fetch on the next tick.
    // Awaiting the returned promise can race with the internal state update,
    // so wait for the resulting state instead.
    void result.current.fetchNextPage();

    await waitFor(
      () => {
        expect(requestedPages).toContain(2);
        expect(result.current.data?.pages.length).toBe(2);
      },
      { timeout: 3000 },
    );

    const allJobs = result.current.data?.pages.flatMap((p) => p.data) ?? [];
    expect(allJobs.map((j) => j.title)).toEqual(["Page 1 Job", "Page 2 Job"]);
    expect(result.current.hasNextPage).toBe(false);
  });
});
