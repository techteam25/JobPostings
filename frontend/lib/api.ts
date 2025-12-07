"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import { JobsResponse, JobResponse, Job } from "@/schemas/responses/jobs";
import {
  ApiResponse,
  Organization,
  OrganizationJobApplications,
  OrganizationWithMembers,
  PaginatedApiResponse,
  SavedJob,
  UserJobApplications,
} from "@/lib/types";

export const getJobs = cache(async (): Promise<JobsResponse> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs`, {
    next: { revalidate: 60, tags: ["jobs"] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return res.json();
});

export const getJobById = cache(async (jobId: number): Promise<JobResponse> => {
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/jobs/${jobId}`, {
    next: { revalidate: 300, tags: [`job-${jobId}`] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json();
});

export const getOrganization = cache(
  async (id: number): Promise<OrganizationWithMembers | null> => {
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
  },
);

export const updateOrganization = async (
  organizationData: Organization | null,
  formData: FormData,
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

export const getOrganizationJobsList = cache(
  async (organizationId: number): Promise<PaginatedApiResponse<Job>> => {
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
  },
);

export const getAllJobsApplicationsForOrganization = cache(
  async (
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
  },
);

export const getAllApplicationsByUser = cache(
  async (): Promise<PaginatedApiResponse<UserJobApplications>> => {
    const cookieStore = await cookies();
    const res = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/jobs/me/applications/`,
      {
        credentials: "include",
        headers: {
          Cookie: cookieStore.toString(),
        },
        next: { revalidate: 60, tags: [`user-applications`] },
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to fetch user's applications");
    }

    return res.json();
  },
);

export const getUserSavedJobs = cache(
  async (): Promise<PaginatedApiResponse<SavedJob>> => {
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
  },
);

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

  return true;
};
