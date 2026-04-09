import type {
  DatePosted,
  FiltersState,
  JobType,
  SortBy,
} from "@/context/store";
import type { SearchJobsParams } from "@/lib/api/search-jobs";
import { parseLocation } from "./parse-location";

/**
 * Maps store field names to URL search param keys.
 */
const PARAM_KEYS = {
  keyword: "q",
  location: "location",
  jobTypes: "jobType",
  remoteOnly: "includeRemote",
  sortBy: "sortBy",
  datePosted: "datePosted",
} as const;

const SORT_BY_DEFAULT: SortBy = "recent";

/**
 * Convert Zustand filter state to URL search params.
 * Omits empty/default values to keep URLs clean.
 */
export function buildSearchParams(
  state: Pick<
    FiltersState,
    "keyword" | "location" | "jobTypes" | "remoteOnly" | "sortBy" | "datePosted"
  >,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.keyword.trim()) {
    params.set(PARAM_KEYS.keyword, state.keyword.trim());
  }

  if (state.location.trim()) {
    params.set(PARAM_KEYS.location, state.location.trim());
  }

  for (const type of state.jobTypes) {
    params.append(PARAM_KEYS.jobTypes, type);
  }

  if (state.remoteOnly) {
    params.set(PARAM_KEYS.remoteOnly, "true");
  }

  if (state.sortBy !== SORT_BY_DEFAULT) {
    params.set(PARAM_KEYS.sortBy, state.sortBy);
  }

  if (state.datePosted) {
    params.set(PARAM_KEYS.datePosted, state.datePosted);
  }

  return params;
}

const VALID_JOB_TYPES = new Set<string>([
  "full-time",
  "part-time",
  "contract",
  "internship",
]);

const VALID_DATE_POSTED = new Set<string>([
  "last-24-hours",
  "last-7-days",
  "last-14-days",
]);

const VALID_SORT_BY = new Set<string>(["relevant", "recent"]);

/**
 * Parse URL search params back into a partial store shape.
 * Used to hydrate Zustand from the URL on page load.
 */
export function parseSearchParams(
  params: URLSearchParams,
): Partial<
  Pick<
    FiltersState,
    "keyword" | "location" | "jobTypes" | "remoteOnly" | "sortBy" | "datePosted"
  >
> {
  const result: Partial<
    Pick<
      FiltersState,
      | "keyword"
      | "location"
      | "jobTypes"
      | "remoteOnly"
      | "sortBy"
      | "datePosted"
    >
  > = {};

  const q = params.get(PARAM_KEYS.keyword);
  if (q) result.keyword = q;

  const location = params.get(PARAM_KEYS.location);
  if (location) result.location = location;

  const jobTypes = params
    .getAll(PARAM_KEYS.jobTypes)
    .filter((t: string) => VALID_JOB_TYPES.has(t));
  if (jobTypes.length > 0) result.jobTypes = jobTypes as JobType[];

  const includeRemote = params.get(PARAM_KEYS.remoteOnly);
  if (includeRemote === "true") result.remoteOnly = true;

  const sortBy = params.get(PARAM_KEYS.sortBy);
  if (sortBy && VALID_SORT_BY.has(sortBy)) result.sortBy = sortBy as SortBy;

  const datePosted = params.get(PARAM_KEYS.datePosted);
  if (datePosted && VALID_DATE_POSTED.has(datePosted))
    result.datePosted = datePosted as DatePosted;

  return result;
}

/**
 * Returns true if any search-relevant param is present in the URL.
 */
export function hasSearchParams(params: URLSearchParams): boolean {
  return Object.values(PARAM_KEYS).some((key) => params.has(key));
}

/**
 * Convert Zustand filter state into API call params.
 * Splits the raw location string into city/state/zipcode via parseLocation.
 */
export function buildApiParams(
  state: Pick<
    FiltersState,
    "keyword" | "location" | "jobTypes" | "remoteOnly" | "sortBy" | "datePosted"
  >,
): SearchJobsParams {
  const params: SearchJobsParams = {};

  if (state.keyword.trim()) {
    params.q = state.keyword.trim();
  }

  if (state.location.trim()) {
    const parsed = parseLocation(state.location);
    if (parsed.city) params.city = parsed.city;
    if (parsed.state) params.state = parsed.state;
    if (parsed.zipcode) params.zipcode = parsed.zipcode;
  }

  if (state.jobTypes.length > 0) {
    params.jobType = state.jobTypes;
  }

  if (state.remoteOnly) {
    params.includeRemote = true;
  }

  if (state.sortBy !== SORT_BY_DEFAULT) {
    params.sortBy = state.sortBy;
  }

  return params;
}
