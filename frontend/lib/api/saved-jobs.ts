"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/env";
import {
  ApiResponse,
  SavedJob,
  SavedState,
  ServerActionPaginatedResponse,
} from "@/lib/types";
import { handleApiResponse, handlePaginatedApiResponse } from "./helpers";

export const getUserSavedJobs = async (): Promise<
  ServerActionPaginatedResponse<SavedJob>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/saved-jobs/`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 60, tags: [`user-saved-jobs`] },
    },
  );

  return handlePaginatedApiResponse(res, "Failed to fetch user's saved jobs");
};

export const saveJobForUser = async (
  jobId: number,
): Promise<ApiResponse<SavedState>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/saved-jobs/${jobId}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  const result = await handleApiResponse<SavedState>(res, "Failed to save job");

  if (result.success) {
    revalidateTag("jobs", "max");
    revalidateTag("user-saved-jobs", "max");
    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath(`/job/${jobId}`);
  }

  return result;
};

export const removeSavedJobForUser = async (
  jobId: number,
): Promise<ApiResponse<void>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/saved-jobs/${jobId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  const result = await handleApiResponse<void>(
    res,
    "Failed to remove saved job",
  );

  if (result.success) {
    revalidateTag("jobs", "max");
    revalidateTag("user-saved-jobs", "max");
    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath(`/job/${jobId}`);
  }

  return result;
};

export const isJobSavedByUser = async (
  jobId: number,
): Promise<ApiResponse<SavedState>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/saved-jobs/${jobId}/check`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 300, tags: [`user-saved-job-${jobId}-exists`] },
    },
  );

  return handleApiResponse(res, "Failed to check if job is saved by user");
};
