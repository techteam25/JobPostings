"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import type { CandidatePreview } from "@/types/candidate";
import type { ServerActionPaginatedResponse } from "@/lib/types";
import { handlePaginatedApiResponse } from "./helpers";

export type SearchCandidatesParams = {
  skills: string[];
  location?: string;
  minYearsExperience?: number;
  openToWork?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "relevant" | "recent" | "name" | "yearsOfExperience";
  sortOrder?: "asc" | "desc";
};

export const searchCandidates = async (
  params: SearchCandidatesParams,
): Promise<ServerActionPaginatedResponse<CandidatePreview>> => {
  const cookieStore = await cookies();
  const url = new URL(
    `${env.NEXT_PUBLIC_SERVER_URL}/organizations/candidates/search`,
  );

  for (const skill of params.skills) {
    url.searchParams.append("skills", skill);
  }
  if (params.location) url.searchParams.set("location", params.location);
  if (params.minYearsExperience !== undefined) {
    url.searchParams.set(
      "minYearsExperience",
      String(params.minYearsExperience),
    );
  }
  if (params.openToWork !== undefined) {
    url.searchParams.set("openToWork", String(params.openToWork));
  }
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 60, tags: ["candidate-search"] },
  });

  return handlePaginatedApiResponse<CandidatePreview>(
    res,
    "Failed to search candidates",
  );
};
