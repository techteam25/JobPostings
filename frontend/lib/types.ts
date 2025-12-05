import { MutableRefObject } from "react";

import { CreateOrganizationData } from "@/schemas/organizations";

export enum JobType {
  FullTime = "Full-time",
  PartTime = "Part-time",
  Contract = "Contract",
  Internship = "Internship",
  Temporary = "Temporary",
}

export interface JobCardType {
  positionName: string;
  companyName: string;
  location: string;
  jobType: JobType;
  experienceLevel: string;
  posted: string;
  jobDescription: string;
  logoUrl: string | null;
  onJobSelected: () => void;
}

export interface TCreateOrganizationFormProps {
  organization: CreateOrganizationData;
  setOrganizationData: (formData: CreateOrganizationData) => void;
  formRef?: MutableRefObject<any>;
}

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

export type OrganizationWithMembers = Organization & {
  members: {
    id: number;
    organizationId: number;
    userId: number;
    role: "owner" | "admin" | "recruiter" | "member";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    memberName: string;
    memberEmail: string;
    memberEmailVerified: boolean;
    memberStatus: string;
  }[];
};

export type Member = OrganizationWithMembers["members"][number];

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errorCode: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type PaginatedApiResponse<T> = ApiSuccessResponse<T[]> & {
  pagination: PaginationMeta;
};
