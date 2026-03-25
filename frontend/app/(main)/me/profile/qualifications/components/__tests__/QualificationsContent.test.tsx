import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { QualificationsContent } from "../QualificationsContent";
import type {
  Education,
  WorkExperience,
  Certification,
  UserSkill,
} from "@/lib/types";

const mockPush = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => "/me/profile/qualifications",
}));

const mockEducation: Education[] = [
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
    major: "AI",
    graduated: false,
    startDate: "2023-01-15T00:00:00.000Z",
    endDate: null,
  },
];

const mockWorkExperiences: WorkExperience[] = [
  {
    id: 1,
    userProfileId: 1,
    companyName: "Acme Corp",
    jobTitle: "Senior Developer",
    description: null,
    current: true,
    startDate: "2022-06-15T00:00:00.000Z",
    endDate: null,
  },
];

const mockCertifications: { certification: Certification }[] = [
  { certification: { id: 1, certificationName: "AWS Solutions Architect" } },
  { certification: { id: 2, certificationName: "GCP Professional" } },
];

const mockSkills: UserSkill[] = [
  {
    id: 1,
    skillId: 10,
    userProfileId: 1,
    skill: { id: 10, name: "React", createdAt: "", updatedAt: "" },
    createdAt: "",
    updatedAt: "",
  },
];

const defaultProps = {
  education: mockEducation,
  workExperiences: mockWorkExperiences,
  certifications: mockCertifications,
  skills: mockSkills,
};

describe("QualificationsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("renders all four tab triggers", () => {
    render(<QualificationsContent {...defaultProps} />);

    expect(screen.getByRole("tab", { name: /education/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /work experience/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /certifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();
  });

  it("displays counts on tab labels", () => {
    render(<QualificationsContent {...defaultProps} />);

    expect(
      screen.getByRole("tab", { name: /education \(2\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /work experience \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /certifications \(2\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /skills \(1\)/i }),
    ).toBeInTheDocument();
  });

  it("defaults to work-experience tab when no query param", () => {
    render(<QualificationsContent {...defaultProps} />);

    const workExpTab = screen.getByRole("tab", { name: /work experience/i });
    expect(workExpTab).toHaveAttribute("data-state", "active");
  });

  it("shows work experience content by default", () => {
    render(<QualificationsContent {...defaultProps} />);

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText(/acme corp/i)).toBeInTheDocument();
  });

  it("updates URL when clicking education tab", async () => {
    const user = userEvent.setup();

    render(<QualificationsContent {...defaultProps} />);

    await user.click(screen.getByRole("tab", { name: /education/i }));

    expect(mockPush).toHaveBeenCalledWith(
      "/me/profile/qualifications?tab=education",
      { scroll: false },
    );
  });

  it("updates URL when clicking certifications tab", async () => {
    const user = userEvent.setup();

    render(<QualificationsContent {...defaultProps} />);

    await user.click(screen.getByRole("tab", { name: /certifications/i }));

    expect(mockPush).toHaveBeenCalledWith(
      "/me/profile/qualifications?tab=certifications",
      { scroll: false },
    );
  });

  it("updates URL when clicking skills tab", async () => {
    const user = userEvent.setup();

    render(<QualificationsContent {...defaultProps} />);

    await user.click(screen.getByRole("tab", { name: /skills/i }));

    expect(mockPush).toHaveBeenCalledWith(
      "/me/profile/qualifications?tab=skills",
      { scroll: false },
    );
  });

  it("renders education content when tab=education in URL", () => {
    currentSearchParams = new URLSearchParams("tab=education");

    render(<QualificationsContent {...defaultProps} />);

    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("Stanford")).toBeInTheDocument();
  });

  it("renders certifications content when tab=certifications in URL", () => {
    currentSearchParams = new URLSearchParams("tab=certifications");

    render(<QualificationsContent {...defaultProps} />);

    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("GCP Professional")).toBeInTheDocument();
  });

  it("renders skills content when tab=skills in URL", () => {
    currentSearchParams = new URLSearchParams("tab=skills");

    render(<QualificationsContent {...defaultProps} />);

    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows empty state when work experiences is empty", () => {
    render(<QualificationsContent {...defaultProps} workExperiences={[]} />);

    expect(screen.getByText(/no work experience added/i)).toBeInTheDocument();
  });

  it("shows empty state when education is empty", () => {
    currentSearchParams = new URLSearchParams("tab=education");

    render(<QualificationsContent {...defaultProps} education={[]} />);

    expect(screen.getByText(/no education added/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add education/i }),
    ).toBeEnabled();
  });

  it("shows empty state when certifications is empty", () => {
    currentSearchParams = new URLSearchParams("tab=certifications");

    render(<QualificationsContent {...defaultProps} certifications={[]} />);

    expect(screen.getByText(/no certifications added/i)).toBeInTheDocument();
  });

  it("shows empty state when skills is empty", () => {
    currentSearchParams = new URLSearchParams("tab=skills");

    render(<QualificationsContent {...defaultProps} skills={[]} />);

    expect(screen.getByText(/no skills added/i)).toBeInTheDocument();
  });

  it("shows zero counts for empty sections", () => {
    render(
      <QualificationsContent
        education={[]}
        workExperiences={[]}
        certifications={[]}
        skills={[]}
      />,
    );

    expect(
      screen.getByRole("tab", { name: /education \(0\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /work experience \(0\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /certifications \(0\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /skills \(0\)/i }),
    ).toBeInTheDocument();
  });

  it("falls back to default tab for invalid tab param", () => {
    currentSearchParams = new URLSearchParams("tab=invalid");

    render(<QualificationsContent {...defaultProps} />);

    const workExpTab = screen.getByRole("tab", { name: /work experience/i });
    expect(workExpTab).toHaveAttribute("data-state", "active");
  });
});
