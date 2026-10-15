import { computeProfileCompletion } from "@/lib/profile-completion";
import type {
  Education,
  Skill,
  UserProfile,
  UserSkill,
  UserWithProfile,
  WorkExperience,
} from "@/lib/types";

type ProfileInner = NonNullable<UserWithProfile["profile"]>;

function makeUser(
  profile: Partial<ProfileInner> | null,
  topLevel: Partial<UserWithProfile> = {},
): UserWithProfile {
  const base: UserWithProfile = {
    id: 1,
    fullName: "Jane Doe",
    email: "jane@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    status: "active",
    deletedAt: null,
    lastLoginAt: null,
    profile: null,
  };

  if (profile === null) {
    return { ...base, ...topLevel, profile: null };
  }

  const profileBase: ProfileInner = {
    id: 10,
    userId: 1,
    profilePicture: null,
    bio: null,
    resumeUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    phoneNumber: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    isProfilePublic: false,
    isAvailableForWork: false,
    fileMetadata: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    education: [],
    workExperiences: [],
    certifications: [],
    skills: [],
  };

  return {
    ...base,
    ...topLevel,
    profile: { ...profileBase, ...profile },
  };
}

const education: Education = {
  id: 1,
  userProfileId: 10,
  schoolName: "State University",
  program: "Bachelors",
  major: "Computer Science",
  graduated: true,
  startDate: "2016-09-01",
  endDate: "2020-05-01",
};

const workExperience: WorkExperience = {
  id: 1,
  userProfileId: 10,
  companyName: "Acme Co",
  jobTitle: "Engineer",
  description: null,
  current: true,
  startDate: "2020-06-01",
  endDate: null,
};

const skill: Skill = {
  id: 1,
  name: "TypeScript",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const userSkill: UserSkill = {
  id: 1,
  skillId: 1,
  userProfileId: 10,
  skill,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

function fullyPopulatedProfile(): Partial<UserProfile> &
  Pick<
    NonNullable<UserWithProfile["profile"]>,
    "education" | "workExperiences" | "skills"
  > {
  return {
    profilePicture: "https://example.com/photo.jpg",
    phoneNumber: "+1 555 123 4567",
    city: "Boston",
    state: "MA",
    country: "USA",
    bio: "A short bio about me.",
    resumeUrl: "https://example.com/resume.pdf",
    education: [education],
    workExperiences: [workExperience],
    skills: [userSkill],
  };
}

describe("computeProfileCompletion", () => {
  it("returns 0% and all items missing when profile is null", () => {
    const result = computeProfileCompletion(makeUser(null));

    expect(result.percentage).toBe(0);
    expect(result.label).toBe("Getting started");
    expect(result.items).toHaveLength(8);
    expect(result.items.every((item) => !item.done)).toBe(true);
    expect(result.missing).toHaveLength(8);
  });

  it("returns 100% and empty missing when fully populated", () => {
    const result = computeProfileCompletion(makeUser(fullyPopulatedProfile()));

    expect(result.percentage).toBe(100);
    expect(result.label).toBe("Strong");
    expect(result.missing).toEqual([]);
  });

  it("counts the pending resume sentinel as not done", () => {
    const result = computeProfileCompletion(
      makeUser({
        ...fullyPopulatedProfile(),
        resumeUrl: "pending:resume-upload",
      }),
    );

    expect(result.percentage).toBe(88);
    expect(result.missing).toEqual([
      {
        id: "resume",
        label: "Upload your resume",
        href: "/me/profile/edit?focus=resume",
      },
    ]);
  });

  it("requires city, state, and country together for location", () => {
    const partial = computeProfileCompletion(
      makeUser({ city: "Boston", state: "MA", country: null }),
    );
    expect(partial.items.find((item) => item.id === "location")?.done).toBe(
      false,
    );

    const complete = computeProfileCompletion(
      makeUser({ city: "Boston", state: "MA", country: "USA" }),
    );
    expect(complete.items.find((item) => item.id === "location")?.done).toBe(
      true,
    );
  });

  it("satisfies the photo item from top-level image when profilePicture is empty", () => {
    const result = computeProfileCompletion(
      makeUser(
        { profilePicture: null },
        { image: "https://example.com/me.png" },
      ),
    );

    expect(result.items.find((item) => item.id === "photo")?.done).toBe(true);
  });

  it("computes exact percentage and missing labels for a mid-range profile", () => {
    // 6 of 8 done: photo, phone, location, bio, work experience, education.
    const result = computeProfileCompletion(
      makeUser({
        profilePicture: "https://example.com/photo.jpg",
        phoneNumber: "+1 555 123 4567",
        city: "Boston",
        state: "MA",
        country: "USA",
        bio: "A short bio.",
        education: [education],
        workExperiences: [workExperience],
      }),
    );

    expect(result.percentage).toBe(75);
    expect(result.label).toBe("Good");
    expect(result.missing).toEqual([
      {
        id: "resume",
        label: "Upload your resume",
        href: "/me/profile/edit?focus=resume",
      },
      {
        id: "skills",
        label: "Add your skills",
        href: "/me/profile/qualifications?tab=skills",
      },
    ]);

    expect(result.missing.find((item) => item.id === "skills")?.href).toBe(
      "/me/profile/qualifications?tab=skills",
    );
  });
});
