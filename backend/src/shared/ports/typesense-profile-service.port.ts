export interface ProfileDocument {
  id: string;
  userId: number;
  name: string;
  photoUrl?: string;
  headline: string;
  skills: string[];
  location: string;
  yearsOfExperience: number;
  openToWork: boolean;
  isProfilePublic: boolean;
  intent: string;
  updatedAt: number;
}

export interface SearchProfilesParams {
  q: string;
  queryBy: string;
  filterBy?: string;
  sortBy?: string;
  page?: number;
  perPage?: number;
  prefix?: boolean;
  numTypos?: number;
}

export interface SearchProfilesResult {
  hits: ProfileDocument[];
  found: number;
  page: number;
}

export interface TypesenseProfileServicePort {
  upsertProfile(doc: ProfileDocument): Promise<void>;
  deleteProfile(userId: string): Promise<void>;
  searchProfilesCollection(
    params: SearchProfilesParams,
  ): Promise<SearchProfilesResult>;
  indexManyProfileDocuments(docs: ProfileDocument[]): Promise<void>;
}
