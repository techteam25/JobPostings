import type { Organization, OrganizationRole } from "@/lib/types";
import { ApiResponse } from "../index";

export type { Organization, OrganizationRole };

export type OrganizationMember = {
  id: number;
  userId: number;
  organizationId: number;
  role: OrganizationRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationWithMembers = Organization & {
  members: OrganizationMember[];
};

export type OrganizationWithMembersResponse =
  ApiResponse<OrganizationWithMembers>;

export type OrganizationIdByMemberIdResponse = ApiResponse<{
  organizationId: number;
}>;
