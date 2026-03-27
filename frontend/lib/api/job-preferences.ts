"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import type { ApiResponse } from "@/lib/types";
import type { JobPreference } from "@/schemas/job-preferences";
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
