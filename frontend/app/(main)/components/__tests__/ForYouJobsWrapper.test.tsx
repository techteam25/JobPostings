import { render, screen } from "@testing-library/react";

import { ForYouJobsWrapper } from "../ForYouJobsWrapper";

const recommendationState = vi.hoisted(() => ({ hasPersonalization: false }));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@/app/(main)/hooks/use-recommended-jobs", () => ({
  useRecommendedJobs: () => ({
    data: { pages: [{ data: [] }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    hasPersonalization: recommendationState.hasPersonalization,
  }),
}));

vi.mock("../JobDetailPanel", () => ({ JobDetailPanel: () => null }));
vi.mock("../JobDetailPanelMobile", () => ({
  JobDetailPanelMobile: () => null,
}));
vi.mock("../JobsWrapper", () => ({ JobDetailPanelSkeleton: () => null }));

describe("empty For You recommendations", () => {
  it("shows next steps to a new seeker", () => {
    recommendationState.hasPersonalization = false;
    render(<ForYouJobsWrapper />);

    expect(screen.getByText("Start building your job profile")).toBeVisible();
    expect(screen.getByRole("link", { name: "Add skills" })).toHaveAttribute(
      "href",
      "/me/profile/qualifications?tab=skills",
    );
    expect(
      screen.getByRole("link", { name: "Set job preferences" }),
    ).toHaveAttribute("href", "/me/profile/preferences");
    expect(
      screen.getByRole("link", { name: "Upload a resume (optional)" }),
    ).toHaveAttribute("href", "/me/profile/edit?focus=resume");
  });

  it("gives an accurate no-match message when matching details exist", () => {
    recommendationState.hasPersonalization = true;
    render(<ForYouJobsWrapper />);

    expect(screen.getByText("No matching jobs right now")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Add skills" })).toBeNull();
  });
});
