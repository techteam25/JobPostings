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

export type UserOrganizationMembership = {
  id: number;
  userId: number;
  organizationId: number;
  role: "owner" | "admin" | "recruiter" | "member";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
};

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
  application: {
    id: number;
    jobTitle: string;
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "rejected"
      | "hired"
      | "withdrawn";
    appliedAt: string;
  };
  job: {
    id: number;
    title: string;
    city: string;
    state: string | null;
    country: string | null;
    zipcode: number | null;
    isRemote: boolean;
    jobType: string;
  };
  employer: {
    id: number;
    name: string;
  };
}[];

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
  userId: number;
  profilePicture: string | null;
  bio: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  isProfilePublic: boolean;
  isAvailableForWork: boolean;
  fileMetadata:
    | {
        url: string;
        filename: string;
        size: number;
        mimetype: string;
        uploadedAt: string;
      }[]
    | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithProfile = {
  id: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  deletedAt: Date | null;
  lastLoginAt: Date | null;
} & { profile: UserProfile | null };


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

export type UserJobApplication = {
  application: {
    id: number;
    jobTitle: string;
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "rejected"
      | "hired"
      | "withdrawn";
    appliedAt: string;
  };
  job: {
    id: number;
    title: string;
    city: string;
    state: string | null;
    country: string | null;
    zipcode: number | null;
    isRemote: boolean;
    jobType: string;
  };
  employer: {
    id: number;
    name: string;
  };
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

export type JobAlert = {
  id: number;
  userId: number;
  name: string;
  description: string;
  state?: string;
  city?: string;
  searchQuery?: string;
  jobType?: Array<"full_time" | "part_time" | "contract" | "temporary" | "intern">;
  skills?: string[];
  experienceLevel?: string[];
  includeRemote: boolean;
  frequency: "daily" | "weekly" | "monthly";
  isActive: boolean;
  isPaused: boolean;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobAlertInput = Omit<JobAlert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastSentAt'>;
export type UpdateJobAlertInput = Partial<CreateJobAlertInput>;

export type Invitation = {
  id: number;
  organizationId: number;
  email: string;
  role: "admin" | "recruiter" | "member";
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type InvitationDetails = {
  invitation: {
    id: number;
    email: string;
    role: string;
    status: string;
    expiresAt: Date;
  };
  organization: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
};

export type OrganizationJobStats = {
  totalJobs: number;
  activeJobs: number;
  expiredJobs: number;
  totalApplications: number;
  applicationsByStatus: {
    pending: number;
    reviewed: number;
    shortlisted: number;
    interviewing: number;
    rejected: number;
    hired: number;
  };
};

export type CreateJobInput = {
  title: string;
  description: string;
  city: string;
  state: string;
  country: string;
  zipcode: number | null;
  jobType: "full-time" | "part-time" | "contract" | "volunteer" | "internship";
  compensationType: "paid" | "missionary" | "volunteer" | "stipend";
  isRemote: boolean;
  applicationDeadline: string | null;
  experience: string;
};

export type UpdateJobInput = Partial<CreateJobInput> & { isActive?: boolean };

export type SendInvitationInput = {
  email: string;
  role: "admin" | "recruiter" | "member";
};
