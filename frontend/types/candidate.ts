export type CandidatePreview = {
  userId: number;
  name: string;
  photoUrl: string | null;
  headline: string;
  skills: string[];
  location: string;
  yearsOfExperience: number;
  openToWork: boolean;
};

export type CandidateSortBy =
  | "relevant"
  | "recent"
  | "name"
  | "yearsOfExperience";

export type CandidateSortOrder = "asc" | "desc";

export type PublicCandidateWorkExperience = {
  jobTitle: string;
  companyName: string;
  description: string | null;
  current: boolean;
  startDate: string;
  endDate: string | null;
};

export type PublicCandidateEducation = {
  schoolName: string;
  major: string;
  graduated: boolean;
  startDate: string;
  endDate: string | null;
};

export type PublicCandidateProfile = {
  userId: number;
  name: string;
  photoUrl: string | null;
  headline: string;
  bio: string | null;
  skills: string[];
  location: string;
  yearsOfExperience: number;
  openToWork: boolean;
  workExperiences: PublicCandidateWorkExperience[];
  educations: PublicCandidateEducation[];
  certifications: string[];
};
