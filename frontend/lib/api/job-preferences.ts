"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import type { ApiResponse } from "@/lib/types";
import type { JobPreference, WorkArea } from "@/schemas/job-preferences";
import { handleApiResponse } from "./helpers";

export const getJobPreferences = async (): Promise<
  ApiResponse<JobPreference | null>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-preferences`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 300, tags: ["job-preferences"] },
    },
  );

  return handleApiResponse(res, "Failed to fetch job preferences");
};

export const updateJobPreferences = async (data: {
  jobTypes?: string[];
  compensationTypes?: string[];
  volunteerHoursPerWeek?: string;
  workScheduleDays?: string[];
  scheduleTypes?: string[];
  workArrangements?: string[];
  commuteTime?: string;
  willingnessToRelocate?: string;
}): Promise<ApiResponse<JobPreference>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-preferences`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(data),
    },
  );

  const result = await handleApiResponse<JobPreference>(
    res,
    "Failed to update job preferences",
  );

  if (result.success) {
    revalidatePath("/me/profile/preferences");
  }

  return result;
};

export const getAvailableWorkAreas = async (): Promise<
  ApiResponse<WorkArea[]>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-preferences/work-areas`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 300, tags: ["work-areas"] },
    },
  );

  return handleApiResponse(res, "Failed to fetch work areas");
};

export const updateWorkAreas = async (data: {
  workAreaIds: number[];
}): Promise<ApiResponse<void>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-preferences/work-areas`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(data),
    },
  );

  const result = await handleApiResponse<void>(
    res,
    "Failed to update work areas",
  );

  if (result.success) {
    revalidatePath("/me/profile/preferences");
  }

  return result;
};
