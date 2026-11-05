"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";
import type { PaginatedApiResponse, ApiErrorResponse } from "@/lib/types";

export type RecommendationsResponse =
  | (PaginatedApiResponse<SearchJobResult> & { hasPersonalization: boolean })
  | ApiErrorResponse;

export async function getRecommendations(params: {
  page?: number;
  limit?: number;
}): Promise<RecommendationsResponse> {
  const cookieStore = await cookies();
  const url = new URL(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/recommendations`);

  if (params.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  // Manual return (not handlePaginatedApiResponse) because the response includes
  // `hasPersonalization` which is outside the standard PaginatedApiResponse shape.
  return res.json().catch(() => ({
    success: false as const,
    message: "Failed to fetch personalized job recommendations",
    errorCode: "PARSE_ERROR",
  }));
}
