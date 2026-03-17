"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import { JobResponse, Job, JobWithEmployer } from "@/schemas/responses/jobs";
import {
  ApiResponse,
  EmailPreferences,
  InvitationDetails,
  JobAlert,
  Organization,
  OrganizationJobApplications,
  OrganizationJobStats,
  OrganizationWithMembers,
  SavedJob,
  SavedState,
  ServerActionPaginatedResponse,
  UserJobApplications,
  UserOrganizationMembership,
  UserProfile,
  UserWithProfile,
} from "@/lib/types";
import { UserIntentResponse } from "@/schemas/responses/users";

async function handleApiResponse<T>(
  res: Response,
  fallbackMessage: string,
): Promise<ApiResponse<T>> {
  return res.json().catch(() => ({
    success: false as const,
    message: fallbackMessage,
    errorCode: "PARSE_ERROR",
  }));
}

async function handlePaginatedApiResponse<T>(
  res: Response,
  fallbackMessage: string,
): Promise<ServerActionPaginatedResponse<T>> {
  return res.json().catch(() => ({
    success: false as const,
    message: fallbackMessage,
    errorCode: "PARSE_ERROR",
  }));
}

export const getUserIntent = async (): Promise<UserIntentResponse> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me/intent`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 300, tags: ["user-intent"] },
  });

  return res.json();
};

export const getUserOrganizations = async (): Promise<
  ApiResponse<UserOrganizationMembership[]>
> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/organizations`,
    {
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
      next: { revalidate: 300, tags: ["user-organizations"] },
    },
  );

  return handleApiResponse(res, "Failed to fetch user organizations");
};

export const getJobs = async (): Promise<
  ServerActionPaginatedResponse<JobWithEmployer>
> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs`, {
    next: { revalidate: 60, tags: ["jobs"] },
  });

  return handlePaginatedApiResponse(res, "Failed to fetch jobs");
};

export const getJobById = async (jobId: number): Promise<JobResponse> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}`, {
    next: { revalidate: 300, tags: [`job-${jobId}`] },
  });

  return res.json();
};

export const getOrganization = async (
  id: number,
): Promise<ApiResponse<OrganizationWithMembers>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${id}`,
    {
      credentials: "include",
      next: { revalidate: 300, tags: [`organization-${id}`] },
    },
  );

  return handleApiResponse(response, "Failed to fetch organization");
};

// TODO: Migrate to ApiResponse<Organization> once CompanyInformation.tsx
// is refactored away from useActionState (which couples return type to state type).
export const updateOrganization = async (
  organizationData: Organization | null,
): Promise<Organization | null> => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${organizationData?.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(organizationData),
    },
  );

  if (!res.ok) {
    return null;
  }

  const data: ApiResponse<Organization> = await res.json();

  if (!data.success || !data.data) {
    return null;
  }

  revalidatePath("/");

  return data.data;
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

  const result = await handleApiResponse<SavedState>(
    res,
    "Failed to save job",
  );

  if (result.success) {
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

export const getUserInformation = async (): Promise<
  ApiResponse<UserWithProfile>
> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 300, tags: [`user-bio-info`] },
  });

  return handleApiResponse(res, "Failed to fetch user information");
};

export const updateProfileVisibility = async (
  isProfilePublic: boolean,
): Promise<ApiResponse<UserProfile>> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me/visibility`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    body: JSON.stringify({ isProfilePublic }),
  });

  const result = await handleApiResponse<UserProfile>(
    res,
    "Failed to update profile visibility",
  );

  if (result.success) {
    revalidatePath("/profile");
  }

  return result;
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

export const getInvitationDetails = async (
  token: string,
): Promise<ApiResponse<InvitationDetails>> => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${token}/details`,
    { next: { revalidate: 0 } },
  );

  return handleApiResponse(res, "Failed to fetch invitation details");
};

export const acceptInvitation = async (
  token: string,
): Promise<ApiResponse<{ organizationId: number }>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${token}/accept`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  return handleApiResponse(res, "Failed to accept invitation");
};
