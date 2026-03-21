"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import {
  ApiResponse,
  OrganizationJobApplications,
  ServerActionPaginatedResponse,
  UserJobApplications,
} from "@/lib/types";
import { handleApiResponse, handlePaginatedApiResponse } from "./helpers";

export const getAllJobsApplicationsForOrganization = async (
  organizationId: string,
): Promise<ServerActionPaginatedResponse<OrganizationJobApplications>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${organizationId}/applications`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: {
        revalidate: 60,
        tags: [`organization-${organizationId}-applications`],
      },
    },
  );

  return handlePaginatedApiResponse(
    res,
    "Failed to fetch organization's job applications",
  );
};

export const getAllApplicationsByUser = async (): Promise<
  ServerActionPaginatedResponse<UserJobApplications>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/jobs/me/applications/`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 60, tags: ["user-applications"] },
    },
  );

  return handlePaginatedApiResponse(
    res,
    "Failed to fetch user's applications",
  );
};

export const applyForJob = async (
  jobId: number,
  formData: FormData,
): Promise<ApiResponse<{ applicationId?: number }>> => {
  const cookieStore = await cookies();

  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    headers: {
      Cookie: cookieStore.toString(),
    },
    body: formData,
  });

  return handleApiResponse(res, "Failed to submit application");
};

export const withdrawJobApplication = async (
  applicationId: number,
): Promise<ApiResponse<void>> => {
  const cookieStore = await cookies();

  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/jobs/applications/${applicationId}/withdraw`,
    {
      method: "PATCH",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  const result = await handleApiResponse<void>(
    res,
    "Failed to withdraw application",
  );

  if (result.success) {
    revalidatePath("/applications");
  }

  return result;
};
