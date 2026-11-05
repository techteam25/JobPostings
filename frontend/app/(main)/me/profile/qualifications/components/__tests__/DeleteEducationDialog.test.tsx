import { render, screen } from "@/test/test-utils";
import { DeleteEducationDialog } from "../DeleteEducationDialog";
import type { Education } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

describe("DeleteEducationDialog", () => {
  it("renders confirmation with school name when open", () => {
    render(
      <DeleteEducationDialog
        education={mockEducation}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/delete education/i)).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });

  it("does not render when education is null", () => {
    render(
      <DeleteEducationDialog
        education={null}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/delete education/i)).not.toBeInTheDocument();
  });

  it("renders cancel and delete buttons", () => {
    render(
      <DeleteEducationDialog
        education={mockEducation}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
