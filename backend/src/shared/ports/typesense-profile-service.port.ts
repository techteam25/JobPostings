export interface ProfileDocument {
  id: string;
  userId: number;
  name: string;
  photoUrl?: string;
  headline: string;
  skills: string[];
  /**
   * Full-form "City, State, Country" tokenized string used by autocomplete
   * + free-text location filters. Kept separate from `zipCode` so the
   * single-field token match doesn't need to account for variable-length
   * postal codes.
   */
  location: string;
  /**
   * Candidate's zip/postal code (optional). Filtered as an AND with
   * `location` when a recruiter picks a zip-code autocomplete suggestion.
   */
  zipCode?: string;
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
