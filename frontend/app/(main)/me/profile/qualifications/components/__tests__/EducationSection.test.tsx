import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { EducationSection } from "../EducationSection";
import type { Education } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/me/profile/qualifications",
}));

const mockEducations: Education[] = [
  {
    id: 1,
    userProfileId: 1,
    schoolName: "MIT",
    program: "Bachelors",
    major: "Computer Science",
    graduated: true,
    startDate: "2018-09-15T00:00:00.000Z",
    endDate: "2022-05-15T00:00:00.000Z",
  },
  {
    id: 2,
    userProfileId: 1,
    schoolName: "Stanford",
    program: "Masters",
    major: "Mathematics",
    graduated: false,
    startDate: "2022-09-01T00:00:00.000Z",
    endDate: null,
  },
];

describe("EducationSection", () => {
  it("renders empty state when no education entries", () => {
    render(<EducationSection education={[]} />);

    expect(screen.getByText(/no education added/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add education/i }),
    ).toBeEnabled();
  });

  it("renders education cards when entries exist", () => {
    render(<EducationSection education={mockEducations} />);

    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("Stanford")).toBeInTheDocument();
  });

  it("renders Add Education button when entries exist", () => {
    render(<EducationSection education={mockEducations} />);

    expect(
      screen.getByRole("button", { name: /add education/i }),
    ).toBeInTheDocument();
  });

  it("opens add dialog when Add Education button is clicked", async () => {
    const user = userEvent.setup();
    render(<EducationSection education={[]} />);

    await user.click(screen.getByRole("button", { name: /add education/i }));

    expect(screen.getByText(/add your education history/i)).toBeInTheDocument();
  });

  it("opens edit dialog when Edit is clicked on a card", async () => {
    const user = userEvent.setup();
    render(<EducationSection education={mockEducations} />);

    const actionButtons = screen.getAllByRole("button", { name: /actions/i });
    await user.click(actionButtons[0]);
    await user.click(screen.getByText("Edit"));

    expect(screen.getByText(/edit education/i)).toBeInTheDocument();
  });

  it("opens delete dialog when Delete is clicked on a card", async () => {
    const user = userEvent.setup();
    render(<EducationSection education={mockEducations} />);

    const actionButtons = screen.getAllByRole("button", { name: /actions/i });
    await user.click(actionButtons[0]);
    await user.click(screen.getByText("Delete"));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });
});
