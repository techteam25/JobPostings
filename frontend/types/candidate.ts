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
