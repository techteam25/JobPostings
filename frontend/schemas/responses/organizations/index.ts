import { ApiResponse } from "../index";

export type Organization = {
  id: number;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string | null;
  url: string;
  logoUrl: string | null;
  mission: string;
  subscriptionTier: "free" | "basic" | "professional" | "enterprise";
  subscriptionStatus: "active" | "cancelled" | "expired" | "trial";
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  jobPostingLimit: number | null;
  status: "active" | "suspended" | "deleted";
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationMember = {
  id: number;
  userId: number;
  organizationId: number;
  role: "owner" | "admin" | "recruiter" | "member";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationWithMembers = Organization & {
  members: OrganizationMember[];
};

export type OrganizationWithMembersResponse =
  ApiResponse<OrganizationWithMembers>;
