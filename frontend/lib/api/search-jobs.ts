"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";
import type { ServerActionPaginatedResponse } from "@/lib/types";
import { handlePaginatedApiResponse } from "./helpers";

export type SearchJobsParams = {
  q?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  jobType?: string[];
  compensationType?: string[];
  includeRemote?: boolean;
  experience?: string;
  sortBy?: string;
  order?: string;
  datePosted?: string;
  page?: number;
  limit?: number;
};

export const searchJobs = async (
  params: SearchJobsParams,
): Promise<ServerActionPaginatedResponse<SearchJobResult>> => {
  const cookieStore = await cookies();
  const url = new URL(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/search`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 60, tags: ["search-jobs"] },
  });

  return handlePaginatedApiResponse(res, "Failed to search jobs");
};
