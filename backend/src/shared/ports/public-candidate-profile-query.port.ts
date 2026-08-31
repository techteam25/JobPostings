import type { PublicCandidateProfile } from "@/validations/candidate-search.validation";

export type { PublicCandidateProfile };

export interface PublicCandidateProfileQueryPort {
  getPublicProfile(userId: number): Promise<PublicCandidateProfile | null>;
}
