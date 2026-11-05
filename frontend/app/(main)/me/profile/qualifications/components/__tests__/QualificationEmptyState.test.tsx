import { render, screen } from "@/test/test-utils";
import { QualificationEmptyState } from "../QualificationEmptyState";

describe("QualificationEmptyState", () => {
  it("renders the section title", () => {
    render(
      <QualificationEmptyState
        title="No Education Added"
        description="Add your educational background to strengthen your profile."
        ctaLabel="Add Education"
      />,
    );

    expect(screen.getByText("No Education Added")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <QualificationEmptyState
        title="No Education Added"
        description="Add your educational background to strengthen your profile."
        ctaLabel="Add Education"
      />,
    );

    expect(
      screen.getByText(
        "Add your educational background to strengthen your profile.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a disabled CTA button", () => {
    render(
      <QualificationEmptyState
        title="No Education Added"
        description="Add your educational background."
        ctaLabel="Add Education"
      />,
    );

    const button = screen.getByRole("button", { name: /add education/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("renders with different props", () => {
    render(
      <QualificationEmptyState
        title="No Skills Added"
        description="Add skills to match with relevant jobs."
        ctaLabel="Add Skill"
      />,
    );

    expect(screen.getByText("No Skills Added")).toBeInTheDocument();
    expect(
      screen.getByText("Add skills to match with relevant jobs."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add skill/i })).toBeDisabled();
  });
});
