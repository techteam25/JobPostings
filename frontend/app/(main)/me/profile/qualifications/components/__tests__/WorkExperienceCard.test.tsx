import { render, screen } from "@/test/test-utils";
import { WorkExperienceCard } from "../WorkExperienceCard";
import type { WorkExperience } from "@/lib/types";

const mockExperience: WorkExperience = {
  id: 1,
  userProfileId: 1,
  companyName: "Acme Corp",
  jobTitle: "Senior Developer",
  description: "Built amazing products",
  current: false,
  startDate: "2020-03-15T00:00:00.000Z",
  endDate: "2023-06-15T00:00:00.000Z",
};

describe("WorkExperienceCard", () => {
  it("renders the job title", () => {
    render(<WorkExperienceCard experience={mockExperience} />);

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
  });

  it("renders the company name", () => {
    render(<WorkExperienceCard experience={mockExperience} />);

    expect(screen.getByText(/acme corp/i)).toBeInTheDocument();
  });

  it("renders formatted date range", () => {
    render(<WorkExperienceCard experience={mockExperience} />);

    expect(screen.getByText(/mar 2020.*jun 2023/i)).toBeInTheDocument();
  });

  it("shows 'Current' badge when current is true", () => {
    const currentJob: WorkExperience = {
      ...mockExperience,
      current: true,
      endDate: null,
    };

    render(<WorkExperienceCard experience={currentJob} />);

    expect(screen.getByText(/current/i)).toBeInTheDocument();
  });

  it("shows 'Present' for end date when current is true", () => {
    const currentJob: WorkExperience = {
      ...mockExperience,
      current: true,
      endDate: null,
    };

    render(<WorkExperienceCard experience={currentJob} />);

    expect(screen.getByText(/present/i)).toBeInTheDocument();
  });

  it("does not show current badge for past jobs", () => {
    render(<WorkExperienceCard experience={mockExperience} />);

    expect(screen.queryByText(/current/i)).not.toBeInTheDocument();
  });
});
