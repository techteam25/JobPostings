"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import {
  ApiResponse,
  Organization,
  OrganizationWithMembers,
  UserOrganizationMembership,
} from "@/lib/types";
import { handleApiResponse } from "./helpers";

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
