"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import type { JobsResponse, JobResponse } from "@/schemas/responses/jobs";
import type { ApiResponse, Organization } from "@/lib/types";

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
  async (id: number): Promise<Organization | null> => {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${id}`,
        {
          next: { revalidate: 300, tags: [`organization-${id}`] },
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch organization:", response.statusText);
        return null;
      }

      const data: ApiResponse<Organization> = await response.json();

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
