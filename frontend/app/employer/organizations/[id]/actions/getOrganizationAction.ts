"use server";

import { getOrganization } from "@/lib/api";
import { ApiResponse, OrganizationWithMembers } from "@/lib/types";

export const getOrganizationAction = async (
  id: number,
): Promise<ApiResponse<OrganizationWithMembers>> => {
  return getOrganization(id);
};
