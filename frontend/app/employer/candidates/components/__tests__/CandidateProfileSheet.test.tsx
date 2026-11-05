import { render, screen } from "@/test/test-utils";
import { vi } from "vitest";

import { CandidateProfileSheet } from "../CandidateProfileSheet";
import type { PublicCandidateProfile } from "@/types/candidate";

const mockProfile: PublicCandidateProfile = {
  userId: 42,
  name: "Jane Doe",
  photoUrl: null,
  headline: "Software Engineer",
  bio: "Mission-minded developer with 6 years of experience.",
  skills: ["TypeScript", "React"],
  location: "Austin, TX, USA",
  yearsOfExperience: 6,
  openToWork: true,
  workExperiences: [
    {
      jobTitle: "Software Engineer",
      companyName: "Mission Tech",
      description: "Built internal tools.",
      current: true,
      startDate: "2020-01-01T00:00:00.000Z",
      endDate: null,
    },
  ],
  educations: [
    {
      schoolName: "Faith University",
      major: "Computer Science",
      graduated: true,
      startDate: "2012-08-15T00:00:00.000Z",
      endDate: "2016-05-20T00:00:00.000Z",
    },
  ],
  certifications: ["AWS Certified Developer"],
};

describe("CandidateProfileSheet", () => {
  it("shows a candidate public profile when opened from search results", () => {
    render(
      <CandidateProfileSheet
        open
        onOpenChange={vi.fn()}
        profile={mockProfile}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText("Mission-minded developer with 6 years of experience."),
    ).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Mission Tech")).toBeInTheDocument();
    expect(screen.getByText("Faith University")).toBeInTheDocument();
    expect(screen.getByText("AWS Certified Developer")).toBeInTheDocument();
    expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
  });
});
