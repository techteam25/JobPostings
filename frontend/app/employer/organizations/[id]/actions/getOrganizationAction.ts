"use server";

import { getOrganization } from "@/lib/api";
import type { Organization } from "@/lib/types";

export const getOrganizationAction = async (
  id: number
): Promise<Organization | null> => {
  return getOrganization(id);
};
