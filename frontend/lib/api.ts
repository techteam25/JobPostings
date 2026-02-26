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
  PaginatedApiResponse,
  SavedJob,
  SavedState,
  UserJobApplications,
  UserOrganizationMembership,
  UserProfile,
  UserWithProfile,
} from "@/lib/types";
import { UserIntentResponse } from "@/schemas/responses/users";

export const getUserIntent = async (): Promise<UserIntentResponse> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me/intent`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 300, tags: ["user-intent"] },
  });

  if (!res.ok) {
    console.error("Failed to fetch user intent");
    return await res.json();
  }

  return await res.json();
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

  if (!res.ok) {
    console.error("Failed to fetch user organizations");
    return await res.json();
  }

  return await res.json();
};

export const getJobs = async (): Promise<
  PaginatedApiResponse<JobWithEmployer>
> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs`, {
    next: { revalidate: 60, tags: ["jobs"] },
  });

  if (!res.ok) {
    return await res.json();
  }

  return res.json();
};

export const getJobById = async (jobId: number): Promise<JobResponse> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}`, {
    next: { revalidate: 300, tags: [`job-${jobId}`] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json();
};

export const getOrganization = async (
  id: number,
): Promise<OrganizationWithMembers | null> => {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${id}`,
      {
        credentials: "include",
        next: { revalidate: 300, tags: [`organization-${id}`] },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch organization:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.error("Organization not found:", data.message);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
};

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
    throw new Error("Failed to update organization");
  }

  const data: ApiResponse<Organization> = await res.json();

  if (!data.success || !data.data) {
    console.error("Failed to update organization:", data.message);
    return null;
  }

  revalidatePath("/");

  return data.data;
};

export const getOrganizationJobsList = async (
  organizationId: number,
): Promise<PaginatedApiResponse<Job>> => {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch organization's jobs");
  }

  return res.json();
};

export const getAllJobsApplicationsForOrganization = async (
  organizationId: string,
): Promise<PaginatedApiResponse<OrganizationJobApplications>> => {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.message || "Failed to fetch organization's job applications",
    );
  }

  return res.json();
};

export const getAllApplicationsByUser = async (): Promise<
  PaginatedApiResponse<UserJobApplications>
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch user's applications");
  }

  return res.json();
};

export const getUserSavedJobs = async (): Promise<
  PaginatedApiResponse<SavedJob>
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch user's saved jobs");
  }

  return res.json();
};

export const saveJobForUser = async (jobId: number): Promise<boolean> => {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to save job for user");
  }

  revalidatePath("/saved");
  revalidatePath(`/job/${jobId}`);

  return true;
};

export const removeSavedJobForUser = async (
  jobId: number,
): Promise<boolean> => {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to remove saved job for user");
  }

  revalidatePath("/saved");
  revalidatePath(`/job/${jobId}`);

  return true;
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

  if (!res.ok) {
    console.error("Failed to check if job is saved by user");
    return await res.json();
  }

  return await res.json();
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

  if (!res.ok) {
    console.error("Failed to fetch user bio info");
    return await res.json();
  }

  return await res.json();
};

type UpdateProfileVisibilityResponse = ApiResponse<UserProfile>;

export const updateProfileVisibility = async (
  isProfilePublic: boolean,
): Promise<UpdateProfileVisibilityResponse> => {
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

  if (!res.ok) {
    console.error("Failed to update profile visibility");
    return await res.json();
  }

  revalidatePath("/profile");

  return await res.json();
};

export const applyForJob = async (
  jobId: number,
  formData: FormData,
): Promise<{ success: boolean; message: string; applicationId?: number }> => {
  const cookieStore = await cookies();

  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    headers: {
      Cookie: cookieStore.toString(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || "Failed to submit application",
    };
  }

  return await res.json();
};

export const withdrawJobApplication = async (
  applicationId: number,
): Promise<{ success: boolean; message: string }> => {
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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || "Failed to withdraw application",
    };
  }

  revalidatePath("/applications");

  return await res.json();
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

  if (!res.ok) {
    console.error("Failed to fetch email preferences");
    return await res.json();
  }

  return await res.json();
};

export const fetchJobAlerts = async (
  page = 1,
  limit = 10,
): Promise<PaginatedApiResponse<JobAlert>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/job-alerts?page=${page}&limit=${limit}`,
    {
      credentials: "include",
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    },
  );
  if (!res.ok) return await res.json();
  return await res.json();
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
  if (!res.ok) return await res.json();
  return await res.json();
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch job stats");
  }

  return res.json();
};

export const getInvitationDetails = async (
  token: string,
): Promise<ApiResponse<InvitationDetails>> => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${token}/details`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch invitation details");
  }

  return res.json();
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to accept invitation");
  }

  return res.json();
};
