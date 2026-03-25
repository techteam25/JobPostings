import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SkillsSection } from "../SkillsSection";
import type { UserSkill } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/me/profile/qualifications",
}));

function createMockSkill(id: number, name: string): UserSkill {
  return {
    id,
    skillId: id * 10,
    userProfileId: 1,
    skill: { id: id * 10, name, createdAt: "", updatedAt: "" },
    createdAt: "",
    updatedAt: "",
  };
}

const mockSkills: UserSkill[] = [
  createMockSkill(1, "React"),
  createMockSkill(2, "TypeScript"),
  createMockSkill(3, "Node.js"),
];

function createManySkills(count: number): UserSkill[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSkill(i + 1, `Skill ${i + 1}`),
  );
}

describe("SkillsSection", () => {
  it("renders empty state when no skills", () => {
    render(<SkillsSection skills={[]} />);

    expect(screen.getByText(/no skills added/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add skill/i })).toBeEnabled();
  });

  it("renders skill badges when entries exist", () => {
    render(<SkillsSection skills={mockSkills} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("renders Add Skill button when entries exist", () => {
    render(<SkillsSection skills={mockSkills} />);

    expect(
      screen.getByRole("button", { name: /add skill/i }),
    ).toBeInTheDocument();
  });

  it("renders remove buttons on each skill badge", () => {
    render(<SkillsSection skills={mockSkills} />);

    expect(
      screen.getByRole("button", { name: /remove react/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove typescript/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove node\.js/i }),
    ).toBeInTheDocument();
  });

  it("opens remove confirmation dialog when remove is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillsSection skills={mockSkills} />);

    await user.click(screen.getByRole("button", { name: /remove react/i }));

    expect(
      screen.getByText(/are you sure you want to remove/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^remove$/i }),
    ).toBeInTheDocument();
  });

  it("opens add dialog when Add Skill is clicked from empty state", async () => {
    const user = userEvent.setup();
    render(<SkillsSection skills={[]} />);

    await user.click(screen.getByRole("button", { name: /add skill/i }));

    expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument();
  });

  it("opens add dialog when Add Skill button is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillsSection skills={mockSkills} />);

    await user.click(screen.getByRole("button", { name: /add skill/i }));

    expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument();
  });

  it("shows skill count", () => {
    render(<SkillsSection skills={mockSkills} />);

    expect(screen.getByText("3/30 skills")).toBeInTheDocument();
  });

  it("shows limit banner and disables add button at 30 skills", () => {
    const thirtySkills = createManySkills(30);
    render(<SkillsSection skills={thirtySkills} />);

    expect(
      screen.getByText(/you've reached the 30-skill limit/i),
    ).toBeInTheDocument();
    expect(screen.getByText("30/30 skills")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add skill/i })).toBeDisabled();
  });
});
