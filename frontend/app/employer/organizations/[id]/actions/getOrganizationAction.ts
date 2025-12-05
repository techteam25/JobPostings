"use server";

import { getOrganization } from "@/lib/api";
import { OrganizationWithMembers } from "@/lib/types";

export const getOrganizationAction = async (
  id: number,
): Promise<OrganizationWithMembers | null> => {
  return getOrganization(id);
};
