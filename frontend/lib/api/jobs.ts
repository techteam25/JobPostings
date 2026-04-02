"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import { JobResponse, Job, JobWithEmployer } from "@/schemas/responses/jobs";
import {
  ApiResponse,
  OrganizationJobStats,
  ServerActionPaginatedResponse,
} from "@/lib/types";
import { handleApiResponse, handlePaginatedApiResponse } from "./helpers";

export const getJobs = async (
  page?: number,
): Promise<ServerActionPaginatedResponse<JobWithEmployer>> => {
  const cookieStore = await cookies();
  const url = new URL(`${env.NEXT_PUBLIC_SERVER_URL}/jobs`);
  if (page) url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 60, tags: ["jobs"] },
  });

  return handlePaginatedApiResponse(res, "Failed to fetch jobs");
};

export const getJobById = async (jobId: number): Promise<JobResponse> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  return res.json();
};

export const getOrganizationJobsList = async (
  organizationId: number,
): Promise<ServerActionPaginatedResponse<Job>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/jobs/employer/${organizationId}/jobs`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 60, tags: [`organization-${organizationId}-jobs`] },
    },
  );

  return handlePaginatedApiResponse(res, "Failed to fetch organization's jobs");
};

export const getOrganizationJobStats = async (
  organizationId: number,
): Promise<ApiResponse<OrganizationJobStats>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/jobs/employer/${organizationId}/jobs/stats`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: {
        revalidate: 60,
        tags: [`organization-${organizationId}-job-stats`],
      },
    },
  );

  return handleApiResponse(res, "Failed to fetch job stats");
};
