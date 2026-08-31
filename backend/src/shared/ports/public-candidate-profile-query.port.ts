export interface PublicCandidateWorkExperience {
  jobTitle: string;
  companyName: string;
  description: string | null;
  current: boolean;
  startDate: string;
  endDate: string | null;
}

export interface PublicCandidateEducation {
  schoolName: string;
  major: string;
  graduated: boolean;
  startDate: string;
  endDate: string | null;
}

/**
 * Allowlisted public profile shape for employer candidate search.
 * Never includes contact details or private fields (email, phone, resume).
 */
export interface PublicCandidateProfile {
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
}

export interface PublicCandidateProfileQueryPort {
  getPublicProfile(userId: number): Promise<PublicCandidateProfile | null>;
}
