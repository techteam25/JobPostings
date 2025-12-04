"use server";

import { env } from "@/env";
import type { ApiResponse, Organization } from "@/lib/types";

export const getOrganizationAction = async (
  id: number
): Promise<Organization | null> => {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${id}`,
      {
        cache: "no-store", // Ensure fresh data on each request
      }
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
};
