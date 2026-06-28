import type { CandidateSearchFiltersState } from "@/context/candidate-search-store";
import type { CandidateSortBy, CandidateSortOrder } from "@/types/candidate";

const PARAM_KEYS = {
  skills: "skills",
  location: "location",
  locationFilter: "locationFilter",
  locationZipcode: "locationZipcode",
  minYearsExperience: "minYearsExperience",
  openToWork: "openToWork",
  page: "page",
  limit: "limit",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
} as const;

const VALID_SORT_BY = new Set<CandidateSortBy>([
  "relevant",
  "recent",
  "name",
  "yearsOfExperience",
]);

const VALID_SORT_ORDER = new Set<CandidateSortOrder>(["asc", "desc"]);

export type CandidateSearchUrlState = Pick<
  CandidateSearchFiltersState,
  | "skills"
  | "location"
  | "locationFilter"
  | "locationZipcode"
  | "minYearsExperience"
  | "openToWork"
> & {
  page?: number;
  limit?: number;
  sortBy?: CandidateSortBy;
  sortOrder?: CandidateSortOrder;
};

export function buildCandidateSearchParams(
  state: CandidateSearchUrlState,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const skill of state.skills) {
    if (skill.trim()) params.append(PARAM_KEYS.skills, skill.trim());
  }

  if (state.location.trim()) {
    params.set(PARAM_KEYS.location, state.location.trim());
  }

  // Only emit `locationFilter` when it diverges from the display `location`.
  // When they match (free-form input), we can reconstruct it at hydration
  // time and keep the URL clean.
  if (
    state.locationFilter.trim() &&
    state.locationFilter.trim() !== state.location.trim()
  ) {
    params.set(PARAM_KEYS.locationFilter, state.locationFilter.trim());
  }

  if (state.locationZipcode.trim()) {
    params.set(PARAM_KEYS.locationZipcode, state.locationZipcode.trim());
  }

  if (
    state.minYearsExperience !== null &&
    state.minYearsExperience !== undefined
  ) {
    params.set(PARAM_KEYS.minYearsExperience, String(state.minYearsExperience));
  }

  if (state.openToWork) {
    params.set(PARAM_KEYS.openToWork, "true");
  }

  if (state.page && state.page > 1) {
    params.set(PARAM_KEYS.page, String(state.page));
  }

  if (state.limit && state.limit !== 20) {
    params.set(PARAM_KEYS.limit, String(state.limit));
  }

  if (state.sortBy && state.sortBy !== "relevant") {
    params.set(PARAM_KEYS.sortBy, state.sortBy);
  }

  if (state.sortOrder) {
    params.set(PARAM_KEYS.sortOrder, state.sortOrder);
  }

  return params;
}

export function parseCandidateSearchParams(
  params: URLSearchParams,
): Partial<CandidateSearchUrlState> {
  const result: Partial<CandidateSearchUrlState> = {};

  const skills = params.getAll(PARAM_KEYS.skills).filter((s) => s.trim());
  if (skills.length > 0) result.skills = skills;

  const location = params.get(PARAM_KEYS.location);
  if (location) result.location = location;

  const locationZipcode = params.get(PARAM_KEYS.locationZipcode);
  if (locationZipcode) {
    result.locationZipcode = locationZipcode;
  }

  // Deriving `locationFilter` from the URL has three cases:
  //
  // 1. Explicit `locationFilter` param present — use it as-is. This is the
  //    "suggestion picked and it diverges from display" case.
  // 2. No `locationFilter`, but `locationZipcode` is present — the user
  //    picked a pure zipcode suggestion; the indexed candidate `location`
  //    never contains zips, so the correct default is empty. Falling back
  //    to the short display value here (e.g. "78701, TX") would AND a
  //    zero-match token filter into the query after reload/share-link.
  // 3. No `locationFilter` and no `locationZipcode` — treat as free-form
  //    input and mirror the display value into the filter so a shared
  //    link still attempts a best-effort match.
  const locationFilter = params.get(PARAM_KEYS.locationFilter);
  if (locationFilter) {
    result.locationFilter = locationFilter;
  } else if (locationZipcode) {
    result.locationFilter = "";
  } else if (location) {
    result.locationFilter = location;
  }

  const minYears = params.get(PARAM_KEYS.minYearsExperience);
  if (minYears !== null) {
    const parsed = Number.parseInt(minYears, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 50) {
      result.minYearsExperience = parsed;
    }
  }

  if (params.get(PARAM_KEYS.openToWork) === "true") {
    result.openToWork = true;
  }

  const page = params.get(PARAM_KEYS.page);
  if (page !== null) {
    const parsed = Number.parseInt(page, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) result.page = parsed;
  }

  const limit = params.get(PARAM_KEYS.limit);
  if (limit !== null) {
    const parsed = Number.parseInt(limit, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      result.limit = parsed;
    }
  }

  const sortBy = params.get(PARAM_KEYS.sortBy);
  if (sortBy && VALID_SORT_BY.has(sortBy as CandidateSortBy)) {
    result.sortBy = sortBy as CandidateSortBy;
  }

  const sortOrder = params.get(PARAM_KEYS.sortOrder);
  if (sortOrder && VALID_SORT_ORDER.has(sortOrder as CandidateSortOrder)) {
    result.sortOrder = sortOrder as CandidateSortOrder;
  }

  return result;
}

export function hasCandidateSearchParams(params: URLSearchParams): boolean {
  return Object.values(PARAM_KEYS).some((key) => params.has(key));
}
