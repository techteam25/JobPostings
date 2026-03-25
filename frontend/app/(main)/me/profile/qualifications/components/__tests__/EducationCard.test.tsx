import { render, screen } from "@/test/test-utils";
import { EducationCard } from "../EducationCard";
import type { Education } from "@/lib/types";

const mockEducation: Education = {
  id: 1,
  userProfileId: 1,
  schoolName: "MIT",
  program: "Bachelors",
  major: "Computer Science",
  graduated: true,
  startDate: "2018-09-15T00:00:00.000Z",
  endDate: "2022-05-15T00:00:00.000Z",
};

describe("EducationCard", () => {
  it("renders the school name", () => {
    render(<EducationCard education={mockEducation} />);

    expect(screen.getByText("MIT")).toBeInTheDocument();
  });

  it("renders the program and major", () => {
    render(<EducationCard education={mockEducation} />);

    expect(screen.getByText(/bachelors/i)).toBeInTheDocument();
    expect(screen.getByText(/computer science/i)).toBeInTheDocument();
  });

  it("renders formatted date range", () => {
    render(<EducationCard education={mockEducation} />);

    expect(screen.getByText(/sep 2018.*may 2022/i)).toBeInTheDocument();
  });

  it("shows 'Present' when endDate is null and not graduated", () => {
    const inProgress: Education = {
      ...mockEducation,
      graduated: false,
      endDate: null,
    };

    render(<EducationCard education={inProgress} />);

    expect(screen.getByText(/present/i)).toBeInTheDocument();
  });

  it("shows graduated badge when graduated is true", () => {
    render(<EducationCard education={mockEducation} />);

    expect(screen.getByText(/graduated/i)).toBeInTheDocument();
  });

  it("does not show graduated badge when graduated is false", () => {
    const notGraduated: Education = {
      ...mockEducation,
      graduated: false,
      endDate: null,
    };

    render(<EducationCard education={notGraduated} />);

    expect(screen.queryByText(/graduated/i)).not.toBeInTheDocument();
  });
});
