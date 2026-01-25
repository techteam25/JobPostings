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

export type OrganizationJobApplications = {
  applicationId: number;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  status:
    | "pending"
    | "reviewed"
    | "shortlisted"
    | "interviewing"
    | "rejected"
    | "hired"
    | "withdrawn";
  coverLetter: string | null;
  resumeUrl: string | null;
  appliedAt: Date;
  reviewedAt: Date | null;
  jobTitle: string;
  organizationId: number;
  organizationName: string;
};

export type UserJobApplications = {
  items: {
    application: {
      id: number;
      jobId: number;
      applicantId: number;
      status:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "interviewing"
        | "rejected"
        | "hired"
        | "withdrawn";
      coverLetter: string | null;
      resumeUrl: string | null;
      appliedAt: Date;
      reviewedAt: Date | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    job: {
      id: number;
      title: string;
      city: string;
      state: string | null;
      country: string;
      zipcode: number | null;
      isRemote: boolean;
      jobType:
        | "full-time"
        | "part-time"
        | "contract"
        | "volunteer"
        | "internship";
    } | null;
    employer: {
      id: number;
      name: string;
    } | null;
  }[];
};

export type SavedJob = {
  id: number;
  savedAt: Date;
  isClosed: boolean;
  isExpired: boolean;
  job: {
    id: number;
    title: string;
    city: string;
    state: string | null;
    country: string;
    isActive: boolean;
    compensationType: "volunteer" | "paid" | "missionary" | "stipend";
    isRemote: boolean;
    applicationDeadline: Date | null;
    jobType:
      | "full-time"
      | "part-time"
      | "contract"
      | "volunteer"
      | "internship";
    employer: {
      id: number;
      name: string;
      logoUrl: string | null;
      url: string | null;
    };
  };
};

export type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  emailVerified: true;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  deletedAt: Date;
  lastLoginAt: Date;
  profile: {
    id: number;
    userId: number;
    profilePicture: string;
    bio: string;
    resumeUrl: string;
    linkedinUrl: string;
    portfolioUrl: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isProfilePublic: true;
    isAvailableForWork: true;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type EmailPreferences = {
  jobMatchNotifications: boolean;
  applicationStatusNotifications: boolean;
  savedJobUpdates: boolean;
  weeklyJobDigest: boolean;
  matchedCandidates: boolean;
  monthlyNewsletter: boolean;
  marketingEmails: boolean;
  accountSecurityAlerts: boolean;
  jobSeekerUnsubscribed: boolean;
  employerUnsubscribed: boolean;
  globalUnsubscribe: boolean;
};

export type UnsubscribeInfo = {
  user: {
    name: string;
    email: string;
  };
  preferences: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    jobMatchNotifications: boolean;
    applicationStatusNotifications: boolean;
    savedJobUpdates: boolean;
    weeklyJobDigest: boolean;
    matchedCandidates: boolean;
    monthlyNewsletter: boolean;
    marketingEmails: boolean;
    accountSecurityAlerts: boolean;
    jobSeekerUnsubscribed: boolean;
    employerUnsubscribed: boolean;
    unsubscribeToken: string;
    tokenCreatedAt: Date;
    unsubscribeTokenExpiresAt: Date | null;
    globalUnsubscribe: boolean;
  };
  token: string;
};

export type SavedState = {
  isSaved: boolean;
};

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
