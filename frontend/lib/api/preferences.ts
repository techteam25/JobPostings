"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import {
  ApiResponse,
  EmailPreferences,
  JobAlert,
  ServerActionPaginatedResponse,
} from "@/lib/types";
import { handleApiResponse, handlePaginatedApiResponse } from "./helpers";

export const fetchEmailPreferences = async (): Promise<
  ApiResponse<EmailPreferences>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/email-preferences`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store", // Disable Next.js cache - TanStack Query handles caching
    },
  );

  return handleApiResponse(res, "Failed to fetch email preferences");
};

export const fetchJobAlerts = async (
  page = 1,
  limit = 10,
): Promise<ServerActionPaginatedResponse<JobAlert>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-alerts?page=${page}&limit=${limit}`,
    {
      credentials: "include",
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    },
  );

  return handlePaginatedApiResponse(res, "Failed to fetch job alerts");
};

export const fetchJobAlert = async (
  alertId: number,
): Promise<ApiResponse<JobAlert>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-alerts/${alertId}`,
    {
      credentials: "include",
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 300, tags: [`job-alert-${alertId}`] },
    },
  );

  return handleApiResponse(res, "Failed to fetch job alert");
};
