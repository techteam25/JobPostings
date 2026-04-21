import sanitizeHtml from "sanitize-html";
import type { ProfileDocument } from "@shared/ports/typesense-profile-service.port";

export interface CandidateSearchBuilderUser {
  id: number;
  fullName: string;
  intent: "seeker" | "employer";
  deletedAt: Date | null;
}

export interface CandidateSearchBuilderProfile {
  profilePicture: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  isProfilePublic: boolean;
  isAvailableForWork: boolean;
}

export interface CandidateSearchBuilderWorkExperience {
  jobTitle: string;
  current: boolean;
  startDate: Date | string;
  endDate: Date | string | null;
}

export interface CandidateSearchBuilderInput {
  user: CandidateSearchBuilderUser;
  userProfile: CandidateSearchBuilderProfile | null | undefined;
  workExperiences: CandidateSearchBuilderWorkExperience[];
  skills: string[];
}

const HEADLINE_MAX_LENGTH = 120;
const DAYS_PER_YEAR = 365;

export function stripHtmlAndMarkdown(input: string): string {
  // `allowedTags: []` + `allowedAttributes: {}`
  // strips every tag while retaining inner text. Bios originate from TipTap,
  // which emits HTML, so this is the primary path. Markdown leftovers
  // (emphasis, links, code fences) only appear if imported content bypassed
  // the editor — we clean those up with a minimal pass for belt-and-suspenders
  // safety.
  let out = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  out = out.replace(/```[\s\S]*?```/g, " ");
  out = out.replace(/`([^`]*)`/g, "$1");
  out = out.replace(/!\[([^\]]*)]\([^)]*\)/g, "$1");
  out = out.replace(/\[([^\]]+)]\([^)]*\)/g, "$1");
  out = out.replace(/[*_~>#]+/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function pickHeadline(
  workExperiences: CandidateSearchBuilderWorkExperience[],
  bio: string | null,
): string {
  const mostRecent = workExperiences.reduce<{
    we: CandidateSearchBuilderWorkExperience;
    startedAt: number;
  } | null>((acc, we) => {
    if (!we.current) return acc;
    const startedAt = new Date(we.startDate).getTime();
    if (!Number.isFinite(startedAt)) return acc;
    if (!acc || startedAt > acc.startedAt) return { we, startedAt };
    return acc;
  }, null);

  if (mostRecent && mostRecent.we.jobTitle.trim()) {
    return mostRecent.we.jobTitle.trim();
  }

  if (bio && bio.trim()) {
    const stripped = stripHtmlAndMarkdown(bio);
    return stripped.slice(0, HEADLINE_MAX_LENGTH);
  }

  return "";
}

function buildLocation(profile: CandidateSearchBuilderProfile): string {
  return [profile.city, profile.state, profile.country]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.trim())
    .join(", ");
}

type Interval = [number, number];

function computeYearsOfExperience(
  workExperiences: CandidateSearchBuilderWorkExperience[],
): number {
  if (workExperiences.length === 0) return 0;

  const now = Date.now();
  const intervals: Interval[] = workExperiences
    .map<Interval>((we) => {
      const start = new Date(we.startDate).getTime();
      const end = we.endDate ? new Date(we.endDate).getTime() : now;
      return [start, Math.max(end, start)];
    })
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end))
    .sort((a, b) => a[0] - b[0]);

  const first = intervals[0];
  if (!first) return 0;

  const merged: Interval[] = [first];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (!current || !last) continue;
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  const totalMs = merged.reduce((sum, [start, end]) => sum + (end - start), 0);
  const totalDays = totalMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(totalDays / DAYS_PER_YEAR));
}

/**
 * Pure builder for candidate-search Typesense documents.
 *
 * Returns `null` when the user is not eligible for indexing — the worker
 * treats a null result as "delete from index" so ineligible users are
 * removed rather than silently skipped.
 */
export function buildCandidateSearchDocument(
  input: CandidateSearchBuilderInput,
): ProfileDocument | null {
  const { user, userProfile, workExperiences, skills } = input;

  if (user.intent !== "seeker") return null;
  if (user.deletedAt !== null) return null;
  if (!userProfile) return null;
  if (!userProfile.isProfilePublic) return null;

  const doc: ProfileDocument = {
    id: String(user.id),
    userId: user.id,
    name: user.fullName,
    headline: pickHeadline(workExperiences, userProfile.bio),
    skills,
    location: buildLocation(userProfile),
    yearsOfExperience: computeYearsOfExperience(workExperiences),
    openToWork: userProfile.isAvailableForWork,
    isProfilePublic: userProfile.isProfilePublic,
    intent: user.intent,
    updatedAt: Date.now(),
  };

  if (userProfile.profilePicture) {
    doc.photoUrl = userProfile.profilePicture;
  }

  const zip = userProfile.zipCode?.trim();
  if (zip) {
    doc.zipCode = zip;
  }

  return doc;
}
