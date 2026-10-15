import type { UserWithProfile } from "@/lib/types";

const RESUME_PENDING_SENTINEL = "pending:resume-upload";

export type ProfileCompletionItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export type ProfileCompletion = {
  percentage: number;
  label: string;
  items: ProfileCompletionItem[];
  missing: Array<{ id: string; label: string; href: string }>;
};

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Computes a profile-completion summary from a UserWithProfile.
 *
 * Eight equally weighted items are evaluated; the percentage is
 * round(doneCount / 8 * 100). A null profile, nullish fields, empty strings,
 * and empty arrays all count as "not done".
 */
export function computeProfileCompletion(
  user: UserWithProfile,
): ProfileCompletion {
  const profile = user.profile;

  const items: ProfileCompletionItem[] = [
    {
      id: "photo",
      label: "Add a profile photo",
      href: "/me/profile/edit?focus=photo",
      done: hasText(profile?.profilePicture) || hasText(user.image),
    },
    {
      id: "phone",
      label: "Add your phone number",
      href: "/me/profile/edit?focus=phone",
      done: hasText(profile?.phoneNumber),
    },
    {
      id: "location",
      label: "Add your location",
      href: "/me/profile/edit?focus=location",
      done:
        hasText(profile?.city) &&
        hasText(profile?.state) &&
        hasText(profile?.country),
    },
    {
      id: "bio",
      label: "Write a short bio",
      href: "/me/profile/edit?focus=bio",
      done: hasText(profile?.bio),
    },
    {
      id: "resume",
      label: "Upload your resume",
      href: "/me/profile/edit?focus=resume",
      done:
        hasText(profile?.resumeUrl) &&
        profile?.resumeUrl !== RESUME_PENDING_SENTINEL,
    },
    {
      id: "workExperience",
      label: "Add work experience",
      href: "/me/profile/qualifications?tab=work-experience",
      done: (profile?.workExperiences?.length ?? 0) > 0,
    },
    {
      id: "education",
      label: "Add your education",
      href: "/me/profile/qualifications?tab=education",
      done: (profile?.education?.length ?? 0) > 0,
    },
    {
      id: "skills",
      label: "Add your skills",
      href: "/me/profile/qualifications?tab=skills",
      done: (profile?.skills?.length ?? 0) > 0,
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percentage = Math.round((doneCount / items.length) * 100);

  const label =
    percentage >= 80 ? "Strong" : percentage >= 50 ? "Good" : "Getting started";

  const missing = items
    .filter((item) => !item.done)
    .map(({ id, label, href }) => ({ id, label, href }));

  return { percentage, label, items, missing };
}
