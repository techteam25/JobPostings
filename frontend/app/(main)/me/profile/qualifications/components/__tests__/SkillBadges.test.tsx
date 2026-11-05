import { render, screen } from "@/test/test-utils";
import { SkillBadges } from "../SkillBadges";
import type { UserSkill } from "@/lib/types";

const mockSkills: UserSkill[] = [
  {
    id: 1,
    skillId: 10,
    userProfileId: 1,
    skill: { id: 10, name: "React", createdAt: "", updatedAt: "" },
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 2,
    skillId: 11,
    userProfileId: 1,
    skill: { id: 11, name: "TypeScript", createdAt: "", updatedAt: "" },
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 3,
    skillId: 12,
    userProfileId: 1,
    skill: { id: 12, name: "Node.js", createdAt: "", updatedAt: "" },
    createdAt: "",
    updatedAt: "",
  },
];

describe("SkillBadges", () => {
  it("renders all skill names as badges", () => {
    render(<SkillBadges skills={mockSkills} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("renders the correct number of badges", () => {
    const { container } = render(<SkillBadges skills={mockSkills} />);

    const badges = container.querySelectorAll("[data-slot='badge']");
    expect(badges).toHaveLength(3);
  });

  it("renders a single skill", () => {
    render(<SkillBadges skills={[mockSkills[0]]} />);

    expect(screen.getByText("React")).toBeInTheDocument();
  });
});
