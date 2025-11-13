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
}
