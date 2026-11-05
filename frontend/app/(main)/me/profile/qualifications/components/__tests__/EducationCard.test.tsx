import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
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

  it("renders kebab menu when onEdit and onDelete are provided", () => {
    render(
      <EducationCard
        education={mockEducation}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /actions/i }),
    ).toBeInTheDocument();
  });

  it("does not render kebab menu when callbacks are not provided", () => {
    render(<EducationCard education={mockEducation} />);

    expect(
      screen.queryByRole("button", { name: /actions/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onEdit with education when Edit is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <EducationCard
        education={mockEducation}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByText("Edit"));

    expect(onEdit).toHaveBeenCalledWith(mockEducation);
  });

  it("calls onDelete with education when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <EducationCard
        education={mockEducation}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith(mockEducation);
  });
});
