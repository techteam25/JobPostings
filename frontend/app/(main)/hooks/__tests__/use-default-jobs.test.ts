import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { type ReactNode, createElement } from "react";

import { useDefaultJobs } from "../use-default-jobs";
import { server } from "@/test/mocks/server";
import {
  JOBS_URL,
  makeJobWithEmployer,
  makeJobsPaginatedResponse,
} from "@/test/mocks/handlers";
import type { PaginatedApiResponse } from "@/lib/types";
import type { JobWithEmployer } from "@/schemas/responses/jobs";

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

function makeInitialData(
  jobs: { id: number; title: string }[],
  pagination?: { page?: number; totalPages?: number; total?: number },
): PaginatedApiResponse<JobWithEmployer> {
  return makeJobsPaginatedResponse(
    jobs.map((j) => makeJobWithEmployer(j)),
    pagination,
  );
}

describe("useDefaultJobs", () => {
  it("provides initial data synchronously on first render", () => {
    const initialData = makeInitialData([{ id: 1, title: "SSR Job" }]);

    const { result } = renderHook(() => useDefaultJobs(initialData), {
      wrapper: createWrapper(),
    });

    // Initial data should be available immediately — no loading state.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.pages.length).toBe(1);
    expect(result.current.data?.pages[0].data[0].job.title).toBe("SSR Job");
  });

  it("reports hasNextPage based on initial data pagination", () => {
    const initialData = makeInitialData([{ id: 1, title: "Job One" }], {
      page: 1,
      totalPages: 3,
      total: 25,
    });

    const { result } = renderHook(() => useDefaultJobs(initialData), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it("reports hasNextPage=false when initial data is the only page", () => {
    const initialData = makeInitialData([{ id: 1, title: "Only Job" }], {
      page: 1,
      totalPages: 1,
    });

    const { result } = renderHook(() => useDefaultJobs(initialData), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetchNextPage sends page=2 and appends results", async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get(JOBS_URL, ({ request }) => {
        const page = Number(
          new URL(request.url).searchParams.get("page") ?? "1",
        );
        requestedPages.push(page);
        return HttpResponse.json(
          makeJobsPaginatedResponse(
            [makeJobWithEmployer({ id: 10 + page, title: `Page ${page} Job` })],
            { page, totalPages: 2 },
          ),
        );
      }),
    );

    const initialData = makeInitialData([{ id: 1, title: "Page 1 Job" }], {
      page: 1,
      totalPages: 2,
      total: 2,
    });

    const { result } = renderHook(() => useDefaultJobs(initialData), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasNextPage).toBe(true);

    void result.current.fetchNextPage();

    await waitFor(
      () => {
        expect(requestedPages).toContain(2);
        expect(result.current.data?.pages.length).toBe(2);
      },
      { timeout: 3000 },
    );

    const allJobs = result.current.data?.pages.flatMap((p) => p.data) ?? [];
    expect(allJobs.map((j) => j.job.title)).toEqual([
      "Page 1 Job",
      "Page 2 Job",
    ]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("surfaces an error when getJobs returns success: false", async () => {
    server.use(
      http.get(JOBS_URL, () => {
        return HttpResponse.json({
          success: false,
          message: "Server error",
          errorCode: "INTERNAL",
        });
      }),
    );

    const initialData = makeInitialData([{ id: 1, title: "Seed" }], {
      page: 1,
      totalPages: 2,
    });

    const { result } = renderHook(() => useDefaultJobs(initialData), {
      wrapper: createWrapper(),
    });

    void result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Server error");
  });
});
